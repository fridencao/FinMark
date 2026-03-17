import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Play, Save, Zap, Users, Mail, Phone, MessageSquare } from 'lucide-react';
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
import { EmptyState } from '@/components/common/EmptyState';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  enabled: boolean;
}

const nodeTypes = [
  { type: 'trigger', label: '触发器', icon: Zap, color: 'bg-blue-500' },
  { type: 'condition', label: '条件判断', icon: Users, color: 'bg-purple-500' },
  { type: 'action', label: '执行动作', icon: Mail, color: 'bg-emerald-500' },
  { type: 'delay', label: '延时等待', icon: Play, color: 'bg-orange-500' },
];

const actionTypes = [
  { type: 'sms', label: '发送短信', icon: MessageSquare },
  { type: 'call', label: '电话外呼', icon: Phone },
  { type: 'push', label: 'APP 推送', icon: Zap },
  { type: 'email', label: '发送邮件', icon: Mail },
  { type: 'wechat', label: '微信消息', icon: MessageSquare },
];

const triggerTypes = [
  { type: 'segment_change', label: '客群变化' },
  { type: 'asset_threshold', label: '资产达标' },
  { type: 'product_expiry', label: '产品到期' },
  { type: 'birthday', label: '客户生日' },
  { type: 'schedule', label: '定时触发' },
];

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: '新工作流',
      description: '',
      nodes: [],
      edges: [],
      enabled: false,
    };
    const newWorkflows = [...workflows, newWorkflow];
    setWorkflows(newWorkflows);
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setSelectedNode(null);
    setIsEditing(false);
  };

  const handleUpdateWorkflow = (updated: Workflow) => {
    const newWorkflows = workflows.map((w) =>
      w.id === updated.id ? updated : w
    );
    setWorkflows(newWorkflows);
    setSelectedWorkflow(updated);
  };

  const handleDeleteWorkflow = (id: string) => {
    const newWorkflows = workflows.filter((w) => w.id !== id);
    setWorkflows(newWorkflows);
    setSelectedWorkflow(null);
  };

  const handleAddNode = (nodeType: string) => {
    if (!selectedWorkflow) return;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: nodeType as WorkflowNode['type'],
      name: `新${nodeTypes.find((t) => t.type === nodeType)?.label || '节点'}`,
      config: {},
      position: { x: 100, y: 100 },
    };

    const updated: Workflow = {
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode],
    };
    handleUpdateWorkflow(updated);
    setSelectedNode(newNode);
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    if (!selectedWorkflow) return;

    const updatedNodes = selectedWorkflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );

    const updated: Workflow = {
      ...selectedWorkflow,
      nodes: updatedNodes,
    };
    handleUpdateWorkflow(updated);
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;

    const updated: Workflow = {
      ...selectedWorkflow,
      nodes: selectedWorkflow.nodes.filter((n) => n.id !== nodeId),
      edges: selectedWorkflow.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    };
    handleUpdateWorkflow(updated);
    setSelectedNode(null);
  };

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find((t) => t.type === type);
    return nodeType?.icon || Zap;
  };

  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find((t) => t.type === type);
    return nodeType?.color || 'bg-slate-500';
  };

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Left Panel - Workflow List */}
      <div className="w-64 border border-slate-200 rounded-lg flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">工作流列表</h3>
          <Button size="sm" onClick={handleCreateWorkflow}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workflows.map((workflow) => (
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
                  {workflow.nodes.length} 个节点
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

      {/* Center Panel - Canvas */}
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
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '保存' : '编辑'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteWorkflow(selectedWorkflow.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* Node Types Toolbar */}
              {isEditing && (
                <div className="w-32 border-r border-slate-200 p-4 space-y-2">
                  <Label className="text-xs font-medium">添加节点</Label>
                  {nodeTypes.map((nodeType) => (
                    <button
                      key={nodeType.type}
                      onClick={() => handleAddNode(nodeType.type)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
                    >
                      <div className={`w-6 h-6 rounded ${nodeType.color} flex items-center justify-center`}>
                        <nodeType.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-slate-600">{nodeType.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Canvas Area */}
              <div className="flex-1 p-4 overflow-auto bg-slate-50">
                {selectedWorkflow.nodes.length > 0 ? (
                  <div className="space-y-4">
                    {selectedWorkflow.nodes.map((node, index) => {
                      const Icon = getNodeIcon(node.type);
                      const color = getNodeColor(node.type);

                      return (
                        <div key={node.id}>
                          {/* Connection Line */}
                          {index > 0 && (
                            <div className="w-0.5 h-8 bg-slate-300 mx-8" />
                          )}

                          {/* Node */}
                          <div
                            className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all ${
                              selectedNode?.id === node.id
                                ? 'border-indigo-500 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                            onClick={() => setSelectedNode(node)}
                          >
                            <GripVertical className="w-4 h-4 text-slate-400" />
                            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-700">{node.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {nodeTypes.find((t) => t.type === node.type)?.label}
                                </Badge>
                              </div>
                            </div>
                            {isEditing && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(node.id);
                                }}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState
                      icon={Zap}
                      title="暂无节点"
                      description="从左侧添加节点开始构建工作流"
                    />
                  </div>
                )}
              </div>
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
            <Badge variant="outline">{nodeTypes.find((t) => t.type === selectedNode.type)?.label}</Badge>
          </div>

          <div className="space-y-4">
            <div>
              <Label>节点名称</Label>
              <Input
                value={selectedNode.name}
                onChange={(e) =>
                  handleUpdateNode(selectedNode.id, { name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {selectedNode.type === 'trigger' && (
              <div>
                <Label>触发类型</Label>
                <Select
                  value={selectedNode.config.type || ''}
                  onValueChange={(value) =>
                    handleUpdateNode(selectedNode.id, {
                      config: { ...selectedNode.config, type: value },
                    })
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

            {selectedNode.type === 'action' && (
              <div>
                <Label>动作类型</Label>
                <Select
                  value={selectedNode.config.actionType || ''}
                  onValueChange={(value) =>
                    handleUpdateNode(selectedNode.id, {
                      config: { ...selectedNode.config, actionType: value },
                    })
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择动作类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map((a) => (
                      <SelectItem key={a.type} value={a.type}>
                        <div className="flex items-center gap-2">
                          <a.icon className="w-4 h-4" />
                          {a.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedNode.type === 'action' && selectedNode.config.actionType && (
              <div>
                <Label>消息内容</Label>
                <Textarea
                  value={selectedNode.config.content || ''}
                  onChange={(e) =>
                    handleUpdateNode(selectedNode.id, {
                      config: { ...selectedNode.config, content: e.target.value },
                    })
                  }
                  disabled={!isEditing}
                  rows={4}
                  placeholder="输入消息模板内容..."
                />
              </div>
            )}

            {selectedNode.type === 'delay' && (
              <div>
                <Label>等待时长 (小时)</Label>
                <Input
                  type="number"
                  value={selectedNode.config.duration || ''}
                  onChange={(e) =>
                    handleUpdateNode(selectedNode.id, {
                      config: { ...selectedNode.config, duration: e.target.value },
                    })
                  }
                  disabled={!isEditing}
                />
              </div>
            )}

            {selectedNode.type === 'condition' && (
              <div>
                <Label>条件表达式</Label>
                <Textarea
                  value={selectedNode.config.expression || ''}
                  onChange={(e) =>
                    handleUpdateNode(selectedNode.id, {
                      config: { ...selectedNode.config, expression: e.target.value },
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  placeholder="例如：asset > 100000"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;
