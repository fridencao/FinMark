import { describe, it, expect, beforeEach } from 'vitest';
import {
  maskPhone,
  maskIdNumber,
  maskName,
  maskEmail,
  maskBankCard,
  maskAUM,
  maskObject,
  maskArray,
  createMaskingRule,
  applyMaskingPolicy,
  maskingStore,
} from '../services/maskingService.js';

describe('maskingService', () => {
  beforeEach(() => {
    maskingStore.clear();
  });

  describe('maskPhone', () => {
    it('should mask standard 11-digit Chinese mobile', () => {
      expect(maskPhone('13812341234')).toBe('138****1234');
    });

    it('should mask phone starting with 15', () => {
      expect(maskPhone('15987654321')).toBe('159****4321');
    });

    it('should mask phone starting with 18', () => {
      expect(maskPhone('18600001111')).toBe('186****1111');
    });

    it('should mask phone starting with 13', () => {
      expect(maskPhone('13312345678')).toBe('133****5678');
    });

    it('should return non-11-digit strings unchanged', () => {
      expect(maskPhone('12345')).toBe('12345');
      expect(maskPhone('123456789012')).toBe('123456789012');
    });

    it('should handle empty string', () => {
      expect(maskPhone('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskPhone(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskPhone(undefined as any)).toBe(undefined);
    });
  });

  describe('maskIdNumber', () => {
    it('should mask 18-digit Chinese ID with X ending', () => {
      expect(maskIdNumber('31010119900101123X')).toBe('310***********123X');
    });

    it('should mask 18-digit Chinese ID with digit ending', () => {
      expect(maskIdNumber('110101199001011234')).toBe('110***********1234');
    });

    it('should return strings shorter than 18 chars unchanged', () => {
      expect(maskIdNumber('1234567')).toBe('1234567');
    });

    it('should return empty string unchanged', () => {
      expect(maskIdNumber('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskIdNumber(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskIdNumber(undefined as any)).toBe(undefined);
    });
  });

  describe('maskName', () => {
    it('should mask 2-char Chinese name', () => {
      expect(maskName('张三')).toBe('张*');
    });

    it('should mask 3-char Chinese name', () => {
      expect(maskName('张三丰')).toBe('张*丰');
    });

    it('should mask multi-char name keeping first char', () => {
      expect(maskName('欧阳锋')).toBe('欧*锋');
    });

    it('should handle single-char name', () => {
      expect(maskName('张')).toBe('张');
    });

    it('should handle empty string', () => {
      expect(maskName('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskName(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskName(undefined as any)).toBe(undefined);
    });
  });

  describe('maskEmail', () => {
    it('should mask email with short local part', () => {
      expect(maskEmail('ab@example.com')).toBe('a***@example.com');
    });

    it('should mask email with long local part', () => {
      expect(maskEmail('zhangsan@example.com')).toBe('z***@example.com');
    });

    it('should mask email with single char local part', () => {
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });

    it('should mask email with subdomain', () => {
      expect(maskEmail('test@mail.example.com')).toBe('t***@mail.example.com');
    });

    it('should return non-email strings unchanged', () => {
      expect(maskEmail('notanemail')).toBe('notanemail');
    });

    it('should handle empty string', () => {
      expect(maskEmail('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskEmail(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskEmail(undefined as any)).toBe(undefined);
    });
  });

  describe('maskBankCard', () => {
    it('should mask 16-digit bank card', () => {
      expect(maskBankCard('6222021234561234')).toBe('6222 **** **** 1234');
    });

    it('should mask 19-digit bank card', () => {
      expect(maskBankCard('6222021234561234567')).toBe('6222 **** **** 4567');
    });

    it('should mask 17-digit card', () => {
      expect(maskBankCard('62220212345612345')).toBe('6222 **** **** 2345');
    });

    it('should return short strings unchanged', () => {
      expect(maskBankCard('12345')).toBe('12345');
    });

    it('should handle empty string', () => {
      expect(maskBankCard('')).toBe('');
    });

    it('should handle null', () => {
      expect(maskBankCard(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskBankCard(undefined as any)).toBe(undefined);
    });
  });

  describe('maskAUM', () => {
    it('should return range for amount below 100k', () => {
      expect(maskAUM(50000)).toBe('<10万');
    });

    it('should return range for 10-50k', () => {
      expect(maskAUM(200000)).toBe('10-50万');
    });

    it('should return range for 50-100k', () => {
      expect(maskAUM(700000)).toBe('50-100万');
    });

    it('should return range for amount above 100k', () => {
      expect(maskAUM(1500000)).toBe('>100万');
    });

    it('should handle zero', () => {
      expect(maskAUM(0)).toBe('<10万');
    });

    it('should handle boundary at 10w', () => {
      expect(maskAUM(100000)).toBe('10-50万');
    });

    it('should handle boundary at 50w', () => {
      expect(maskAUM(500000)).toBe('50-100万');
    });

    it('should handle boundary at 100w', () => {
      expect(maskAUM(10000000)).toBe('>100万');
    });

    it('should handle string numbers', () => {
      expect(maskAUM('500000' as any)).toBe('50-100万');
    });

    it('should handle null', () => {
      expect(maskAUM(null as any)).toBe('N/A');
    });

    it('should handle undefined', () => {
      expect(maskAUM(undefined as any)).toBe('N/A');
    });

    it('should handle NaN', () => {
      expect(maskAUM(NaN)).toBe('N/A');
    });
  });

  describe('maskObject', () => {
    it('should mask phone field', () => {
      const obj = { name: '张三', phone: '13812341234' };
      const result = maskObject(obj);
      expect(result.phone).toBe('138****1234');
      expect(result.name).toBe('张*');
    });

    it('should mask idCard field', () => {
      const obj = { idCard: '110101199001011234' };
      const result = maskObject(obj);
      expect(result.idCard).toBe('110***********1234');
    });

    it('should mask email field', () => {
      const obj = { email: 'test@example.com' };
      const result = maskObject(obj);
      expect(result.email).toBe('t***@example.com');
    });

    it('should mask bankCard field', () => {
      const obj = { bankCard: '6222021234561234' };
      const result = maskObject(obj);
      expect(result.bankCard).toBe('6222 **** **** 1234');
    });

    it('should mask aum field', () => {
      const obj = { aum: 5000000 };
      const result = maskObject(obj);
      expect(result.aum).toBe('>100万');
    });

    it('should not mask non-sensitive fields', () => {
      const obj = { id: 1, title: '报告' };
      const result = maskObject(obj);
      expect(result).toEqual({ id: 1, title: '报告' });
    });

    it('should handle empty object', () => {
      expect(maskObject({})).toEqual({});
    });

    it('should handle null', () => {
      expect(maskObject(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskObject(undefined as any)).toBe(undefined);
    });

    it('should use custom field mappings', () => {
      const obj = { mobile: '13812341234' };
      const result = maskObject(obj, { mobile: 'phone' });
      expect(result.mobile).toBe('138****1234');
    });
  });

  describe('maskArray', () => {
    it('should mask array of objects', () => {
      const arr = [
        { name: '张三', phone: '13812341234' },
        { name: '李四', phone: '13912345678' },
      ];
      const result = maskArray(arr);
      expect(result[0].phone).toBe('138****1234');
      expect(result[1].phone).toBe('139****5678');
      expect(result[0].name).toBe('张*');
      expect(result[1].name).toBe('李*');
    });

    it('should handle empty array', () => {
      expect(maskArray([])).toEqual([]);
    });

    it('should handle null', () => {
      expect(maskArray(null as any)).toBe(null);
    });

    it('should handle undefined', () => {
      expect(maskArray(undefined as any)).toBe(undefined);
    });
  });

  describe('createMaskingRule', () => {
    it('should create a masking rule', () => {
      const rule = createMaskingRule({
        name: 'custom_field',
        fieldName: 'secret',
        maskFn: (val: string) => val.replace(/./g, '*'),
      });
      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('custom_field');
      expect(rule.fieldName).toBe('secret');
    });

    it('should apply custom masking rule', () => {
      const rule = createMaskingRule({
        name: 'license_plate',
        fieldName: 'plate',
        maskFn: (val: string) => val.slice(0, 2) + '***' + val.slice(-1),
      });
      const obj = { plate: '京A12345' };
      const result = maskObject(obj);
      expect(result.plate).toBe('京A***5');
    });
  });

  describe('applyMaskingPolicy', () => {
    it('should apply built-in policy to object', () => {
      const obj = { name: '张三', phone: '13812341234', email: 'test@test.com' };
      const result = applyMaskingPolicy(obj, 'standard');
      expect(result.phone).toBe('138****1234');
      expect(result.name).toBe('张*');
      expect(result.email).toBe('t***@test.com');
    });

    it('should return original object for unknown policy', () => {
      const obj = { name: '张三' };
      const result = applyMaskingPolicy(obj, 'nonexistent');
      expect(result).toEqual(obj);
    });

    it('should handle array with policy', () => {
      const arr = [{ phone: '13812341234' }, { phone: '13912345678' }];
      const result = applyMaskingPolicy(arr, 'standard');
      expect(result[0].phone).toBe('138****1234');
      expect(result[1].phone).toBe('139****5678');
    });

    it('should handle null', () => {
      expect(applyMaskingPolicy(null as any, 'standard')).toBe(null);
    });
  });
});
