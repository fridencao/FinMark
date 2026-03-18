import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { workflows, getWorkflow, listWorkflows } from './workflows/index.js';
import { WorkflowState, WorkflowExecution, WorkflowResult } from './types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://agent-service:3001';

app.use(cors());
app.use(express.json());

const executions: Map<string, WorkflowExecution> = new Map();

async function callAgentService(agentType: string, prompt: string, context: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${AGENT_SERVICE_URL}/agents/${agentType}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
  });
  
  if (!response.ok) {
    throw new Error(`Agent service error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.result;
}

async function executeWorkflow(workflowId: string, initialContext: Record<string, unknown>): Promise<WorkflowResult> {
  const workflow = getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const executionId = uuidv4();
  const state: WorkflowState = {
    goal: workflow.name,
    context: initialContext,
    currentStep: '',
    results: {},
    errors: [],
    status: 'running',
  };

  const execution: WorkflowExecution = {
    id: executionId,
    workflowId,
    state,
    startedAt: new Date(),
  };

  executions.set(executionId, execution);

  try {
    for (const step of workflow.steps) {
      state.currentStep = step.name;
      
      try {
        const stepInput = {
          ...step.input,
          context: {
            ...initialContext,
            ...state.results,
          },
        };

        const result = await callAgentService(
          step.agentType,
          stepInput.prompt as string,
          stepInput.context as Record<string, unknown>
        );

        state.results[step.id] = result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        state.errors.push(`Step ${step.name} failed: ${errorMessage}`);
        
        if (step.onError === 'abort') {
          throw error;
        }
      }
    }

    state.status = state.errors.length > 0 ? 'failed' : 'completed';
  } catch (error) {
    state.status = 'failed';
    state.errors.push(error instanceof Error ? error.message : String(error));
  }

  execution.completedAt = new Date();

  return {
    success: state.status === 'completed',
    workflowId,
    executionId,
    state,
  };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'workflow-service' });
});

app.get('/workflows', (req, res) => {
  const workflowList = listWorkflows();
  res.json({
    workflows: workflowList.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      steps: w.steps.length,
    })),
  });
});

app.get('/workflows/:id', (req, res) => {
  const workflow = getWorkflow(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

app.post('/workflows/:id/execute', async (req, res) => {
  try {
    const { context = {} } = req.body;
    const result = await executeWorkflow(req.params.id, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Workflow execution failed' });
  }
});

app.get('/executions', (req, res) => {
  const executionList = Array.from(executions.values()).map((e) => ({
    id: e.id,
    workflowId: e.workflowId,
    status: e.state.status,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
  }));
  res.json({ executions: executionList });
});

app.get('/executions/:id', (req, res) => {
  const execution = executions.get(req.params.id);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  res.json(execution);
});

app.listen(PORT, () => {
  console.log(`Workflow Service running on port ${PORT}`);
});

export default app;
