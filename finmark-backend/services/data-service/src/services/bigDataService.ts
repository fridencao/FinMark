import { GraphQLClient } from 'graphql-request';
import { bigDataConfig } from '../config/bigData.js';

interface CustomerSegment {
  id: string;
  name: string;
  level: string;
  tags: string[];
}

interface CustomerBehavior {
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
  channelUsage: { channel: string; count: number }[];
  productHoldings: { product: string; amount: number }[];
}

class BigDataService {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(bigDataConfig.graphqlEndpoint, {
      headers: {
        'Authorization': `Bearer ${bigDataConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getCustomerSegment(customerId: string) {
    const query = `
      query GetCustomerSegment($customerId: ID!) {
        customer(id: $customerId) {
          segment {
            id
            name
            level
            tags
          }
          behaviorScore
          riskScore
        }
      }
    `;

    const result = await this.client.request<{ customer: { segment: CustomerSegment; behaviorScore: number; riskScore: number } }>(query, { customerId });
    return result.customer;
  }

  async getCustomerBehavior(customerId: string, days: number = 30) {
    const query = `
      query GetCustomerBehavior($customerId: ID!, $days: Int!) {
        customerBehavior(id: $customerId, days: $days) {
          transactionCount
          totalAmount
          avgAmount
          channelUsage {
            channel
            count
          }
          productHoldings {
            product
            amount
          }
        }
      }
    `;

    const result = await this.client.request<{ customerBehavior: CustomerBehavior }>(query, { customerId, days });
    return result.customerBehavior;
  }

  async searchSegmentCustomers(segmentId: string, filters?: {
    minAsset?: number;
    maxAsset?: number;
    ageRange?: [number, number];
    city?: string;
  }) {
    const query = `
      query SearchSegmentCustomers($segmentId: ID!, $filters: CustomerFilters) {
        segmentCustomers(segmentId: $segmentId, filters: $filters) {
          total
          customers {
            id
            name
            asset
            segment
            tags
          }
        }
      }
    `;

    const result = await this.client.request<{
      segmentCustomers: {
        total: number;
        customers: { id: string; name: string; asset: number; segment: string; tags: string[] }[];
      };
    }>(query, { segmentId, filters });
    return result.segmentCustomers;
  }

  async getAudiencePreview(conditions: any[], limit: number = 1000) {
    const query = `
      query GetAudiencePreview($conditions: [ConditionInput!]!, $limit: Int!) {
        audiencePreview(conditions: $conditions, limit: $limit) {
          total
          sample {
            id
            name
            segment
            asset
            tags
          }
        }
      }
    `;

    const result = await this.client.request<{
      audiencePreview: {
        total: number;
        sample: { id: string; name: string; segment: string; asset: number; tags: string[] }[];
      };
    }>(query, { conditions, limit });
    return result.audiencePreview;
  }
}

export const bigDataService = new BigDataService();
