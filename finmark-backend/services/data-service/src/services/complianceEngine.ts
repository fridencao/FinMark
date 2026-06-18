export interface ForbiddenWord {
  id: string;
  word: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  replacement: string;
  enabled: boolean;
  createdAt: Date;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
}

export interface ForbiddenWordMatch {
  word: string;
  category: string;
  severity: string;
  replacement: string;
  position: number;
}

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  description: string;
  details: Record<string, unknown>;
}

export interface ComplianceCheckResult {
  passed: boolean;
  score: number;
  forbiddenWords: ForbiddenWordMatch[];
  ruleViolations: RuleViolation[];
  suggestions: string[];
}

export interface FullCheckInput {
  content: string;
  customerRiskLevel?: string;
  productRiskLevel?: string;
  additionalContext?: Record<string, unknown>;
}

export class ComplianceEngine {
  private forbiddenWords: Map<string, ForbiddenWord> = new Map();
  private rules: Map<string, ComplianceRule> = new Map();

  addForbiddenWord(word: ForbiddenWord): void {
    this.forbiddenWords.set(word.id, word);
  }

  removeForbiddenWord(id: string): void {
    this.forbiddenWords.delete(id);
  }

  updateForbiddenWord(id: string, updates: Partial<ForbiddenWord>): void {
    const existing = this.forbiddenWords.get(id);
    if (existing) {
      this.forbiddenWords.set(id, { ...existing, ...updates });
    }
  }

  getForbiddenWords(): ForbiddenWord[] {
    return Array.from(this.forbiddenWords.values());
  }

  addRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(id: string): void {
    this.rules.delete(id);
  }

  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  checkContent(content: string): ComplianceCheckResult {
    const enabledWords = this.getForbiddenWords().filter(w => w.enabled);
    const matches: ForbiddenWordMatch[] = [];
    const suggestions: string[] = [];

    for (const word of enabledWords) {
      const regex = new RegExp(word.word, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          word: word.word,
          category: word.category,
          severity: word.severity,
          replacement: word.replacement,
          position: match.index,
        });
        suggestions.push(`将 "${word.word}" 替换为 "${word.replacement}"`);
      }
    }

    const score = this.calculateScore(matches);
    const passed = matches.length === 0;

    return {
      passed,
      score,
      forbiddenWords: matches,
      ruleViolations: [],
      suggestions,
    };
  }

  checkRiskMatch(customerRiskLevel: string, productRiskLevel: string): ComplianceCheckResult {
    const riskRules = this.getRules().filter(r => r.type === 'risk_match' && r.enabled);
    const violations: RuleViolation[] = [];

    for (const rule of riskRules) {
      const config = rule.config as {
        allowedMapping: Record<string, string[]>;
      };

      const allowedLevels = config.allowedMapping[customerRiskLevel];
      if (allowedLevels && !allowedLevels.includes(productRiskLevel)) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          description: rule.description,
          details: {
            customerRiskLevel,
            productRiskLevel,
            allowedLevels,
          },
        });
      }
    }

    const passed = violations.length === 0;
    return {
      passed,
      score: passed ? 100 : 0,
      forbiddenWords: [],
      ruleViolations: violations,
      suggestions: violations.map(v =>
        `风险等级不匹配: 客户 ${v.details.customerRiskLevel} 级别不适合购买 ${v.details.productRiskLevel} 级别产品`
      ),
    };
  }

  fullCheck(input: FullCheckInput): ComplianceCheckResult {
    const contentResult = this.checkContent(input.content);

    let riskResult: ComplianceCheckResult | null = null;
    if (input.customerRiskLevel && input.productRiskLevel) {
      riskResult = this.checkRiskMatch(input.customerRiskLevel, input.productRiskLevel);
    }

    const allForbiddenWords = contentResult.forbiddenWords;
    const allRuleViolations = [...contentResult.ruleViolations, ...(riskResult?.ruleViolations || [])];
    const allSuggestions = [...contentResult.suggestions, ...(riskResult?.suggestions || [])];

    const score = riskResult
      ? Math.round((contentResult.score + riskResult.score) / 2)
      : contentResult.score;

    return {
      passed: contentResult.passed && (riskResult?.passed ?? true),
      score,
      forbiddenWords: allForbiddenWords,
      ruleViolations: allRuleViolations,
      suggestions: allSuggestions,
    };
  }

  private calculateScore(matches: ForbiddenWordMatch[]): number {
    if (matches.length === 0) return 100;

    const severityWeights: Record<string, number> = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50,
    };

    let deduction = 0;
    for (const match of matches) {
      deduction += severityWeights[match.severity] || 10;
    }

    return Math.max(0, 100 - deduction);
  }
}
