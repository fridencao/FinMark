export interface WorkflowState {
  goal: string;
  context: Record<string, unknown>;
  currentStep: string;
  results: Record<string, unknown>;
  errors: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: string;
  input: Record<string, unknown>;
  condition?: string;
  onError?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  state: WorkflowState;
  startedAt: Date;
  completedAt?: Date;
}

export type WorkflowResult = {
  success: boolean;
  workflowId: string;
  executionId: string;
  state: WorkflowState;
};
