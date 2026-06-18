import { describe, it, expect, beforeEach } from 'vitest';
import { ComplianceEngine, ForbiddenWord, ComplianceRule, ComplianceCheckResult } from '../services/complianceEngine.js';

describe('ComplianceEngine', () => {
  let engine: ComplianceEngine;

  beforeEach(() => {
    engine = new ComplianceEngine();
  });

  describe('Forbidden Word Management', () => {
    it('should add a forbidden word', () => {
      const word: ForbiddenWord = {
        id: '1',
        word: '保本保息',
        category: '收益承诺',
        severity: 'high',
        replacement: '历史业绩不代表未来表现',
        enabled: true,
        createdAt: new Date(),
      };

      engine.addForbiddenWord(word);
      const words = engine.getForbiddenWords();
      expect(words).toHaveLength(1);
      expect(words[0].word).toBe('保本保息');
    });

    it('should remove a forbidden word', () => {
      const word: ForbiddenWord = {
        id: '1',
        word: '保本保息',
        category: '收益承诺',
        severity: 'high',
        replacement: '历史业绩不代表未来表现',
        enabled: true,
        createdAt: new Date(),
      };

      engine.addForbiddenWord(word);
      engine.removeForbiddenWord('1');
      expect(engine.getForbiddenWords()).toHaveLength(0);
    });

    it('should update a forbidden word', () => {
      const word: ForbiddenWord = {
        id: '1',
        word: '保本保息',
        category: '收益承诺',
        severity: 'high',
        replacement: '历史业绩不代表未来表现',
        enabled: true,
        createdAt: new Date(),
      };

      engine.addForbiddenWord(word);
      engine.updateForbiddenWord('1', { severity: 'critical' });
      const updated = engine.getForbiddenWords()[0];
      expect(updated.severity).toBe('critical');
    });

    it('should only check enabled forbidden words', () => {
      const enabledWord: ForbiddenWord = {
        id: '1',
        word: '保本保息',
        category: '收益承诺',
        severity: 'high',
        replacement: '历史业绩不代表未来表现',
        enabled: true,
        createdAt: new Date(),
      };

      const disabledWord: ForbiddenWord = {
        id: '2',
        word: '绝对收益',
        category: '收益承诺',
        severity: 'high',
        replacement: '预期收益率',
        enabled: false,
        createdAt: new Date(),
      };

      engine.addForbiddenWord(enabledWord);
      engine.addForbiddenWord(disabledWord);

      const result = engine.checkContent('这是一个保本保息的产品');
      expect(result.forbiddenWords).toHaveLength(1);
      expect(result.forbiddenWords[0].word).toBe('保本保息');
    });
  });

  describe('Content Compliance Check', () => {
    beforeEach(() => {
      const words: ForbiddenWord[] = [
        {
          id: '1',
          word: '保本保息',
          category: '收益承诺',
          severity: 'high',
          replacement: '历史业绩不代表未来表现',
          enabled: true,
          createdAt: new Date(),
        },
        {
          id: '2',
          word: '绝对收益',
          category: '收益承诺',
          severity: 'high',
          replacement: '预期收益率',
          enabled: true,
          createdAt: new Date(),
        },
        {
          id: '3',
          word: '零风险',
          category: '风险描述',
          severity: 'critical',
          replacement: '低风险',
          enabled: true,
          createdAt: new Date(),
        },
        {
          id: '4',
          word: '稳赚不赔',
          category: '收益承诺',
          severity: 'critical',
          replacement: '投资有风险',
          enabled: true,
          createdAt: new Date(),
        },
      ];

      words.forEach(w => engine.addForbiddenWord(w));
    });

    it('should detect forbidden words in content', () => {
      const result = engine.checkContent('这是一款保本保息的理财产品');
      expect(result.passed).toBe(false);
      expect(result.forbiddenWords).toHaveLength(1);
      expect(result.forbiddenWords[0].word).toBe('保本保息');
      expect(result.forbiddenWords[0].replacement).toBe('历史业绩不代表未来表现');
    });

    it('should detect multiple forbidden words', () => {
      const result = engine.checkContent('这是一款保本保息、零风险的产品，稳赚不赔');
      expect(result.passed).toBe(false);
      expect(result.forbiddenWords).toHaveLength(3);
    });

    it('should return passed for clean content', () => {
      const result = engine.checkContent('这是一款稳健型理财产品，历史业绩仅供参考');
      expect(result.passed).toBe(true);
      expect(result.forbiddenWords).toHaveLength(0);
    });

    it('should calculate compliance score', () => {
      const result = engine.checkContent('这是一款保本保息的产品');
      expect(result.score).toBeLessThan(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should provide suggestions for fixing content', () => {
      const result = engine.checkContent('这是一款保本保息的产品');
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toContain('保本保息');
      expect(result.suggestions[0]).toContain('历史业绩不代表未来表现');
    });
  });

  describe('Compliance Rules', () => {
    it('should add a compliance rule', () => {
      const rule: ComplianceRule = {
        id: '1',
        name: '风险等级匹配',
        description: '产品风险等级必须与客群风险等级匹配',
        type: 'risk_match',
        enabled: true,
        config: {
          productRiskField: 'riskLevel',
          customerRiskField: 'riskLevel',
          allowedMapping: {
            'R1': ['R1', 'R2'],
            'R2': ['R1', 'R2', 'R3'],
            'R3': ['R2', 'R3', 'R4'],
            'R4': ['R3', 'R4', 'R5'],
            'R5': ['R4', 'R5'],
          },
        },
        createdAt: new Date(),
      };

      engine.addRule(rule);
      expect(engine.getRules()).toHaveLength(1);
    });

    it('should check risk level matching', () => {
      const rule: ComplianceRule = {
        id: '1',
        name: '风险等级匹配',
        description: '产品风险等级必须与客群风险等级匹配',
        type: 'risk_match',
        enabled: true,
        config: {
          productRiskField: 'riskLevel',
          customerRiskField: 'riskLevel',
          allowedMapping: {
            'R1': ['R1', 'R2'],
            'R2': ['R1', 'R2', 'R3'],
            'R3': ['R2', 'R3', 'R4'],
            'R4': ['R3', 'R4', 'R5'],
            'R5': ['R4', 'R5'],
          },
        },
        createdAt: new Date(),
      };

      engine.addRule(rule);

      // R3 customer buying R5 product should fail
      const result = engine.checkRiskMatch('R3', 'R5');
      expect(result.passed).toBe(false);

      // R3 customer buying R3 product should pass
      const result2 = engine.checkRiskMatch('R3', 'R3');
      expect(result2.passed).toBe(true);
    });
  });

  describe('Full Compliance Check', () => {
    beforeEach(() => {
      const words: ForbiddenWord[] = [
        {
          id: '1',
          word: '保本保息',
          category: '收益承诺',
          severity: 'high',
          replacement: '历史业绩不代表未来表现',
          enabled: true,
          createdAt: new Date(),
        },
      ];
      words.forEach(w => engine.addForbiddenWord(w));

      const rule: ComplianceRule = {
        id: '1',
        name: '风险等级匹配',
        description: '产品风险等级必须与客群风险等级匹配',
        type: 'risk_match',
        enabled: true,
        config: {
          productRiskField: 'riskLevel',
          customerRiskField: 'riskLevel',
          allowedMapping: {
            'R1': ['R1', 'R2'],
            'R2': ['R1', 'R2', 'R3'],
            'R3': ['R2', 'R3', 'R4'],
            'R4': ['R3', 'R4', 'R5'],
            'R5': ['R4', 'R5'],
          },
        },
        createdAt: new Date(),
      };
      engine.addRule(rule);
    });

    it('should perform full compliance check', () => {
      const result = engine.fullCheck({
        content: '这是一款保本保息的产品',
        customerRiskLevel: 'R3',
        productRiskLevel: 'R5',
      });

      expect(result.passed).toBe(false);
      expect(result.forbiddenWords.length).toBeGreaterThan(0);
      expect(result.ruleViolations.length).toBeGreaterThan(0);
    });

    it('should pass for compliant content', () => {
      const result = engine.fullCheck({
        content: '这是一款稳健型理财产品，历史业绩仅供参考',
        customerRiskLevel: 'R3',
        productRiskLevel: 'R3',
      });

      expect(result.passed).toBe(true);
      expect(result.forbiddenWords).toHaveLength(0);
      expect(result.ruleViolations).toHaveLength(0);
    });
  });
});
