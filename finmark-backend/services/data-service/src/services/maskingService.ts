import { randomUUID } from 'crypto';

export interface MaskingRule {
  id: string;
  name: string;
  fieldName: string;
  maskFn: (value: string) => string;
  createdAt: Date;
}

export interface MaskingPolicy {
  name: string;
  fieldMap: Record<string, 'phone' | 'idNumber' | 'name' | 'email' | 'bankCard' | 'aum' | string>;
}

const builtInPolicies: Record<string, MaskingPolicy> = {
  standard: {
    name: 'standard',
    fieldMap: {
      phone: 'phone',
      mobile: 'phone',
      tel: 'phone',
      telephone: 'phone',
      name: 'name',
      customerName: 'name',
      contactName: 'name',
      idCard: 'idNumber',
      idNumber: 'idNumber',
      identityNo: 'idNumber',
      email: 'email',
      mail: 'email',
      bankCard: 'bankCard',
      cardNo: 'bankCard',
      accountNo: 'bankCard',
      aum: 'aum',
      totalAum: 'aum',
    },
  },
};

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const ID_REGEX = /^\d{17}[\dXx]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BANK_CARD_REGEX = /^\d{16,19}$/;

export const maskingStore = new Map<string, MaskingRule>();

function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function maskPhone(value: string | null | undefined): string | null | undefined {
  if (isNil(value)) return value;
  if (typeof value !== 'string') return value;
  if (!PHONE_REGEX.test(value)) return value;
  return value.slice(0, 3) + '****' + value.slice(-4);
}

export function maskIdNumber(value: string | null | undefined): string | null | undefined {
  if (isNil(value)) return value;
  if (typeof value !== 'string') return value;
  if (!ID_REGEX.test(value)) return value;
  return value.slice(0, 3) + '*'.repeat(11) + value.slice(-4);
}

export function maskName(value: string | null | undefined): string | null | undefined {
  if (isNil(value)) return value;
  if (typeof value !== 'string') return value;
  if (value.length === 0) return value;
  if (value.length === 1) return value;
  if (value.length === 2) return value[0] + '*';
  return value[0] + '*'.repeat(value.length - 2) + value[value.length - 1];
}

export function maskEmail(value: string | null | undefined): string | null | undefined {
  if (isNil(value)) return value;
  if (typeof value !== 'string') return value;
  if (!EMAIL_REGEX.test(value)) return value;
  const atIdx = value.indexOf('@');
  const local = value.slice(0, atIdx);
  const domain = value.slice(atIdx);
  return local[0] + '***' + domain;
}

export function maskBankCard(value: string | null | undefined): string | null | undefined {
  if (isNil(value)) return value;
  if (typeof value !== 'string') return value;
  if (!BANK_CARD_REGEX.test(value)) return value;
  const digits = value.replace(/\s/g, '');
  const first4 = digits.slice(0, 4);
  const last4 = digits.slice(-4);
  return first4 + ' **** **** ' + last4;
}

export function maskAUM(value: number | string | null | undefined): string {
  if (isNil(value)) return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  if (num < 100_000) return '<10万';
  if (num < 500_000) return '10-50万';
  if (num < 1_000_000) return '50-100万';
  return '>100万';
}

const MASK_TYPE_FNS: Record<string, (value: any) => any> = {
  phone: maskPhone,
  idNumber: maskIdNumber,
  name: maskName,
  email: maskEmail,
  bankCard: maskBankCard,
  aum: maskAUM,
};

function detectFieldType(key: string): string | null {
  const lower = key.toLowerCase();
  if (/phone|mobile|tel|telephone/i.test(lower)) return 'phone';
  if (/id[_\s]?card|idnumber|identity/i.test(lower)) return 'idNumber';
  if (/^name$|customer[_\s]?name|contact[_\s]?name|username/i.test(lower)) return 'name';
  if (/email|mail/i.test(lower)) return 'email';
  if (/bank[_\s]?card|card[_\s]?no|account[_\s]?no|acct[_\s]?no/i.test(lower)) return 'bankCard';
  if (/^aum$|total[_\s]?aum|asset/i.test(lower)) return 'aum';
  return null;
}

function detectAndMask(key: string, value: any, fieldMap?: Record<string, string>): any {
  if (isNil(value)) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return value;

  const maskType = fieldMap?.[key] || detectFieldType(key);
  if (maskType && MASK_TYPE_FNS[maskType]) {
    return MASK_TYPE_FNS[maskType](value);
  }

  for (const rule of maskingStore.values()) {
    if (rule.fieldName === key) {
      return rule.maskFn(String(value));
    }
  }

  return value;
}

export function maskObject<T extends Record<string, any>>(
  obj: T | null | undefined,
  fieldMappings?: Record<string, string>
): T | null | undefined {
  if (isNil(obj)) return obj;
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = maskObject(value, fieldMappings);
    } else if (Array.isArray(value)) {
      result[key] = maskArray(value, fieldMappings);
    } else {
      result[key] = detectAndMask(key, value, fieldMappings);
    }
  }
  return result as T;
}

export function maskArray<T extends Record<string, any>>(
  arr: T[] | null | undefined,
  fieldMappings?: Record<string, string>
): T[] | null | undefined {
  if (isNil(arr)) return arr;
  return arr.map((item) => {
    if (item !== null && item !== undefined && typeof item === 'object') {
      return maskObject(item, fieldMappings);
    }
    return item;
  });
}

export function createMaskingRule(rule: Omit<MaskingRule, 'id' | 'createdAt'>): MaskingRule {
  const fullRule: MaskingRule = {
    ...rule,
    id: randomUUID(),
    createdAt: new Date(),
  };
  maskingStore.set(fullRule.id, fullRule);
  MASK_TYPE_FNS[fullRule.name] = fullRule.maskFn;
  return fullRule;
}

export function deleteMaskingRule(id: string): boolean {
  const rule = maskingStore.get(id);
  if (!rule) return false;
  maskingStore.delete(id);
  delete MASK_TYPE_FNS[rule.name];
  return true;
}

export function getMaskingRules(): MaskingRule[] {
  return Array.from(maskingStore.values());
}

export function applyMaskingPolicy<T>(data: T, policyName: string): T {
  if (isNil(data)) return data;
  const policy = builtInPolicies[policyName];
  if (!policy) return data;

  if (Array.isArray(data)) {
    return maskArray(data as any, policy.fieldMap) as T;
  }
  if (typeof data === 'object' && data !== null) {
    return maskObject(data as any, policy.fieldMap) as T;
  }
  return data;
}
