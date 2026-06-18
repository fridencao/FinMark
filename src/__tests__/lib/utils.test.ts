import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('base');
    expect(result).toContain('active');
  });

  it('should handle false conditions', () => {
    const isActive = false;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('base');
    expect(result).not.toContain('active');
  });

  it('should handle undefined', () => {
    const result = cn('base', undefined);
    expect(result).toContain('base');
  });

  it('should handle null', () => {
    const result = cn('base', null);
    expect(result).toContain('base');
  });

  it('should merge multiple classes', () => {
    const result = cn('a', 'b', 'c');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).toContain('c');
  });
});
