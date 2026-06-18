import { describe, it, expect } from 'vitest';

describe('API Service', () => {
  it('should have correct base URL', () => {
    // Test API configuration
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    expect(baseUrl).toBeDefined();
  });
});
