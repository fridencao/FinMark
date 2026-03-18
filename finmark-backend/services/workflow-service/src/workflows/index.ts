import { WorkflowDefinition, WorkflowStep } from '../types.js';

export const marketingCampaignWorkflow: WorkflowDefinition = {
  id: 'marketing-campaign',
  name: 'Marketing Campaign Workflow',
  description: 'End-to-end marketing campaign generation with audience analysis, content creation, and compliance review',
  steps: [
    {
      id: 'analyze-audience',
      name: 'Analyze Target Audience',
      agentType: 'segment',
      input: {
        prompt: 'Analyze target audience for marketing campaign',
        context: {},
      },
    },
    {
      id: 'generate-insights',
      name: 'Generate Market Insights',
      agentType: 'insight',
      input: {
        prompt: 'Generate market insights for campaign',
        context: {},
      },
    },
    {
      id: 'create-strategy',
      name: 'Create Marketing Strategy',
      agentType: 'strategy',
      input: {
        prompt: 'Create marketing strategy based on audience and insights',
        context: {},
      },
    },
    {
      id: 'generate-content',
      name: 'Generate Marketing Content',
      agentType: 'content',
      input: {
        prompt: 'Generate marketing content based on strategy',
        context: {},
      },
    },
    {
      id: 'compliance-check',
      name: 'Compliance Review',
      agentType: 'compliance',
      input: {
        prompt: 'Review content for compliance',
        context: {},
      },
    },
  ],
};

export const contentGenerationWorkflow: WorkflowDefinition = {
  id: 'content-generation',
  name: 'Content Generation Workflow',
  description: 'Generate and refine content with AI analysis and compliance checks',
  steps: [
    {
      id: 'analyze-topic',
      name: 'Analyze Topic',
      agentType: 'insight',
      input: {
        prompt: 'Analyze the given topic',
        context: {},
      },
    },
    {
      id: 'generate-draft',
      name: 'Generate Draft',
      agentType: 'content',
      input: {
        prompt: 'Generate initial content draft',
        context: {},
      },
    },
    {
      id: 'refine-content',
      name: 'Refine Content',
      agentType: 'content',
      input: {
        prompt: 'Refine and improve the content',
        context: {},
      },
    },
    {
      id: 'compliance-review',
      name: 'Compliance Review',
      agentType: 'compliance',
      input: {
        prompt: 'Review content for compliance',
        context: {},
      },
    },
  ],
};

export const dataAnalysisWorkflow: WorkflowDefinition = {
  id: 'data-analysis',
  name: 'Data Analysis Workflow',
  description: 'Comprehensive data analysis with segment analysis and report generation',
  steps: [
    {
      id: 'analyze-segments',
      name: 'Analyze Data Segments',
      agentType: 'segment',
      input: {
        prompt: 'Analyze data segments',
        context: {},
      },
    },
    {
      id: 'generate-insights',
      name: 'Generate Insights',
      agentType: 'insight',
      input: {
        prompt: 'Generate insights from data',
        context: {},
      },
    },
    {
      id: 'analyze-data',
      name: 'Analyze Data',
      agentType: 'analyst',
      input: {
        prompt: 'Perform detailed data analysis',
        context: {},
      },
    },
  ],
};

export const workflows: Record<string, WorkflowDefinition> = {
  'marketing-campaign': marketingCampaignWorkflow,
  'content-generation': contentGenerationWorkflow,
  'data-analysis': dataAnalysisWorkflow,
};

export function getWorkflow(id: string): WorkflowDefinition | undefined {
  return workflows[id];
}

export function listWorkflows(): WorkflowDefinition[] {
  return Object.values(workflows);
}
