import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Play, Save, Zap, Settings } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  Workflow as WorkflowType,
} from '@/services/expert';

const nodeTypesConfig = [
  { type: 'trigger', label: '触发器', icon: '⚡', color: '#3B82F6', description: '工作流触发条件' },
  { type: 'condition', label: '条件判断', icon: '🔀', color: '#8B5CF6', description: '分支逻辑判断' },
  { type: 'action', label: '执行动作', icon: '🎯', color: '#10B981', description: '执行具体操作' },
  { type: 'delay', label: '延时等待', icon: '⏳', color: '#F59E0B', description: '等待指定时间' },
];

const triggerTypes = [
  { type: 'segment_change', label: '客群变化' },
  { type: 'asset_threshold', label: '资产达标' },
  { type: 'product_expiry', label: '产品到期' },
  { type: 'birthday', label: '客户生日' },
  { type: 'schedule', label: '定时触发' },
];

const actionTypes = [
  { type: 'sms', label: '发送短信' },
  { type: 'call', label: '电话外呼' },
  { type: 'push', label: 'APP 推送' },
  { type: 'email', label: '发送邮件' },
  { type: 'wechat', label: '微信消息' },
];

interface CustomNodeData {
  label: string;
  type: string;
  config?: Record<string, any>;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

function CustomNode({ id, data }: { id: string; data: CustomNodeData }) {
  const nodeType = nodeTypesConfig.find((t) => t.type === data.type);
  
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-slate-200 hover:border-indigo-400 transition-colors min-w-[200px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: nodeType?.color || '#64748B' }}
        >
          {nodeType?.icon}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-slate-700">{data.label}</div>
          <div className="text-xs text-slate-400">{nodeType?.label}</div>
        </div>
      </div>
      {data.config && (
        <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500">
          {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="truncate">
              {key}: {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [nodePosition, setNodePosition] = useState<{ x: number; y: number } | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch workflows
  const { data: workflowsData } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => getWorkflows(),
  });

  const workflows = workflowsData?.data || [];

  // Mutations
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowType> }) =>
      updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setSelectedWorkflow(null);
      setNodes([]);
      setEdges([]);
    },
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => executeWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const handleCreateWorkflow = () => {
    const name = prompt('请输入工作流名称:');
    if (!name) return;
    
    const description = prompt('请输入工作流描述 (可选):') || '';
    
    createMutation.mutate(
      { name, description },
      {
        onSuccess: (data) => {
          const workflow = data.data;
          setSelectedWorkflow(workflow);
          loadWorkflowNodes(workflow);
          setIsEditing(true);
        },
      }
    );
  };

  const loadWorkflowNodes = (workflow: WorkflowType) => {
    const flowNodes: Node[] = workflow.nodes?.map((node: any) => ({
      id: node.id,
      type: 'custom',
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.name,
        type: node.type,
        config: node.config,
      },
    })) || [];

    const flowEdges: Edge[] = workflow.edges?.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      markerEnd: { type: MarkerType.ArrowClosed },
    })) || [];

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const handleSelectWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    loadWorkflowNodes(workflow);
    setIsEditing(false);
  };

  const handleSaveWorkflow = () => {
    if (!selectedWorkflow) return;

    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: node.data?.type || 'action',
      name: node.data?.label || 'Node',
      config: node.data?.config || {},
      position: node.position,
    }));

    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    updateMutation.mutate({
      id: selectedWorkflow.id,
      data: {
        nodes: workflowNodes,
        edges: workflowEdges,
      },
    });

    setIsEditing(false);
  };

  const handleDeleteWorkflow = () => {
    if (!selectedWorkflow) return;
    if (confirm('确定要删除这个工作流吗？')) {
      deleteMutation.mutate(selectedWorkflow.id);
    }
  };

  const handleExecuteWorkflow = () => {
    if (!selectedWorkflow) return;
    executeMutation.mutate(selectedWorkflow.id);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleAddNode = (nodeType: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: `新${nodeTypesConfig.find((t) => t.type === nodeType)?.label || '节点'}`,
        type: nodeType,
        config: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowNodeDialog(false);
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleUpdateNodeConfig = (config: Record<string, any>) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: { ...node.data, config },
            }
          : node
      )
    );

    setSelectedNode((prev) =>
      prev ? { ...prev, data: { ...prev.data, config } } : null
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  return (
    <div className="flex gap-6 h-[700px]">
      {/* Left Panel - Workflow List */}
      <div className="w-64 border border-slate-200 rounded-lg flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">工作流列表</h3>
          <Button size="sm" onClick={handleCreateWorkflow}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workflows.map((workflow: WorkflowType) => (
            <button
              key={workflow.id}
              onClick={() => handleSelectWorkflow(workflow)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedWorkflow?.id === workflow.id
                  ? 'bg-indigo-50 border-2 border-indigo-200'
                  : 'bg-white border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700">
                  {workflow.name}
                </span>
                {workflow.enabled && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                    启用
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {workflow.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400">
                  {workflow.nodes?.length || 0} 个节点
                </span>
                <span className="text-xs text-slate-400">
                  {workflow.edges?.length || 0} 条连接
                </span>
              </div>
            </button>
          ))}

          {workflows.length === 0 && (
            <EmptyState
              icon={Zap}
              title="暂无工作流"
              description="点击右上角 + 按钮创建新工作流"
            />
          )}
        </div>
      </div>

      {/* Center Panel - React Flow Canvas */}
      <div className="flex-1 border border-slate-200 rounded-lg flex flex-col">
        {selectedWorkflow ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-700">{selectedWorkflow.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedWorkflow.description || '暂无描述'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExecuteWorkflow}
                  disabled={isEditing}
                >
                  <Play className="w-4 h-4 mr-1" />
                  执行
                </Button>
                <Button
                  size="sm"
                  variant={isEditing ? 'default' : 'outline'}
                  onClick={isEditing ? handleSaveWorkflow : () => setIsEditing(true)}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isEditing ? '保存' : '编辑'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteWorkflow}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                deleteKeyCode={['Backspace', 'Delete']}
                onNodesDelete={(deleted) => {
                  deleted.forEach((node) => {
                    setSelectedNode(null);
                  });
                }}
              >
                <Controls />
                <Background variant="dots" gap={15} size={1} />
                
                {isEditing && (
                  <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
                    <Label className="text-xs font-medium mb-2 block">添加节点</Label>
                    <div className="space-y-2">
                      {nodeTypesConfig.map((nodeType) => (
                        <Dialog key={nodeType.type} open={showNodeDialog} onOpenChange={setShowNodeDialog}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-xs"
                            >
                              <span className="text-lg mr-2">{nodeType.icon}</span>
                              {nodeType.label}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>添加 {nodeType.label}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-sm text-slate-500">{nodeType.description}</p>
                              <Button
                                onClick={() => {
                                  const centerX = window.innerWidth / 2 - 100;
                                  const centerY = window.innerHeight / 2 - 50;
                                  handleAddNode(nodeType.type, { x: centerX, y: centerY });
                                }}
                              >
                                添加到画布中心
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Zap}
              title="选择工作流"
              description="从左侧列表中选择一个工作流"
            />
          </div>
        )}
      </div>

      {/* Right Panel - Node Configuration */}
      {selectedNode && (
        <div className="w-80 border border-slate-200 rounded-lg p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">节点配置</h3>
            <Button size="sm" variant="ghost" onClick={handleDeleteNode}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>节点名称</Label>
              <Input
                value={selectedNode.data?.label || ''}
                onChange={(e) => {
                  const newLabel = e.target.value;
                  setNodes((nds) =>
                    nds.map((node) =>
                      node.id === selectedNode.id
                        ? { ...node, data: { ...node.data, label: newLabel } }
                        : node
                    )
                  );
                  setSelectedNode((prev) =>
                    prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null
                  );
                }}
                disabled={!isEditing}
              />
            </div>

            {selectedNode.data?.type === 'trigger' && (
              <div>
                <Label>触发类型</Label>
                <Select
                  value={selectedNode.data?.config?.type || ''}
                  onValueChange={(value) =>
                    handleUpdateNodeConfig({ ...selectedNode.data?.config, type: value })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择触发类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedNode.data?.type === 'action' && (
              <>
                <div>
                  <Label>动作类型</Label>
                  <Select
                    value={selectedNode.data?.config?.actionType || ''}
                    onValueChange={(value) =>
                      handleUpdateNodeConfig({ ...selectedNode.data?.config, actionType: value })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择动作类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionTypes.map((a) => (
                        <SelectItem key={a.type} value={a.type}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedNode.data?.config?.actionType && (
                  <div>
                    <Label>消息内容</Label>
                    <Textarea
                      value={selectedNode.data?.config?.content || ''}
                      onChange={(e) =>
                        handleUpdateNodeConfig({
                          ...selectedNode.data?.config,
                          content: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      rows={4}
                      placeholder="输入消息模板内容..."
                    />
                  </div>
                )}
              </>
            )}

            {selectedNode.data?.type === 'delay' && (
              <div>
                <Label>等待时长 (小时)</Label>
                <Input
                  type="number"
                  value={selectedNode.data?.config?.duration || ''}
                  onChange={(e) =>
                    handleUpdateNodeConfig({
                      ...selectedNode.data?.config,
                      duration: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                />
              </div>
            )}

            {selectedNode.data?.type === 'condition' && (
              <div>
                <Label>条件表达式</Label>
                <Textarea
                  value={selectedNode.data?.config?.expression || ''}
                  onChange={(e) =>
                    handleUpdateNodeConfig({
                      ...selectedNode.data?.config,
                      expression: e.target.value,
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  placeholder="例如：asset > 100000"
                />
              </div>
            )}

            <Card className="p-3 bg-slate-50">
              <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="text-xs text-slate-500">
                  <div className="font-medium text-slate-700 mb-1">连接提示:</div>
                  <div>• 点击节点右下角的连接点拖拽到目标节点</div>
                  <div>• 按 Delete 键删除选中的节点</div>
                  <div>• 滚动鼠标滚轮缩放画布</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;
