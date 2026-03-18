export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  segment?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMCampaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string[];
  content?: string;
  metrics?: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface CRMLead {
  id: string;
  name: string;
  email: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source?: string;
  assignedTo?: string;
  score?: number;
}

export interface RightsPermission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  scope: 'own' | 'team' | 'department' | 'all';
  conditions?: Record<string, unknown>;
}

export interface RightsRole {
  id: string;
  name: string;
  description: string;
  permissions: RightsPermission[];
  parentRoleId?: string;
}

export interface RightsUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
  department?: string;
  permissions?: RightsPermission[];
}

export interface RightsCheckResult {
  allowed: boolean;
  reason?: string;
  permissions?: RightsPermission[];
}

export interface IntegrationConfig {
  crm: {
    enabled: boolean;
    provider: 'salesforce' | 'hubspot' | 'custom';
    apiUrl: string;
    apiKey: string;
  };
  rights: {
    enabled: boolean;
    provider: 'custom' | 'keycloak' | 'okta';
    apiUrl: string;
    apiKey: string;
  };
}
