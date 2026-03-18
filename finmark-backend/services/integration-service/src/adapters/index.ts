import { CRMIntegration, CRMConfig } from '../crm/index.js';
import { RightsIntegration, RightsConfig } from '../rights/index.js';
import { IntegrationConfig } from '../types.js';

export class IntegrationAdapter {
  private crm?: CRMIntegration;
  private rights?: RightsIntegration;
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;

    if (config.crm.enabled) {
      this.crm = new CRMIntegration({
        provider: config.crm.provider,
        apiUrl: config.crm.apiUrl,
        apiKey: config.crm.apiKey,
      });
    }

    if (config.rights.enabled) {
      this.rights = new RightsIntegration({
        provider: config.rights.provider,
        apiUrl: config.rights.apiUrl,
        apiKey: config.rights.apiKey,
      });
    }
  }

  getCRM(): CRMIntegration | undefined {
    return this.crm;
  }

  getRights(): RightsIntegration | undefined {
    return this.rights;
  }

  isCRMEnabled(): boolean {
    return this.config.crm.enabled;
  }

  isRightsEnabled(): boolean {
    return this.config.rights.enabled;
  }

  async healthCheck(): Promise<{ crm: boolean; rights: boolean }> {
    const results = { crm: false, rights: false };

    if (this.crm) {
      try {
        await this.crm.getContacts(1);
        results.crm = true;
      } catch {
        results.crm = false;
      }
    }

    if (this.rights) {
      try {
        await this.rights.getRoles();
        results.rights = true;
      } catch {
        results.rights = false;
      }
    }

    return results;
  }
}
