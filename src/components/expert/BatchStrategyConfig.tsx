import React, { useState } from 'react';
import { Plus, Trash2, Copy, Save, Upload, Download, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/EmptyState';

interface Strategy {
  id: string;
  name: string;
  description: string;
  targetSegment: string;
  channel: string;
  content: string;
  schedule: string;
  enabled: boolean;
}

interface BatchStrategyConfigProps {
  onStrategiesChange?: (strategies: Strategy[]) => void;
}

const defaultStrategies: Strategy[] = [
  {
    id: '1',
    name: '新客理财推广',
    description: '针对新开户客户推广理财产品',
    targetSegment: '新开户客户',
    channel: '短信 + APP 推送',
    content: '尊敬的客户，为您精选稳健理财产品...',
    schedule: '每周一 9:00',
    enabled: true,
  },
  {
    id: '2',
    name: '高净值客户专属服务',
    description: '为高净值客户提供专属理财顾问服务',
    targetSegment: 'AUM > 100 万',
    channel: '客户经理电话',
    content: '尊敬的贵宾，我们为您准备了专属服务...',
    schedule: '每月 1 号',
    enabled: true,
  },
];

export function BatchStrategyConfig({ onStrategiesChange }: BatchStrategyConfigProps) {
  const [strategies, setStrategies] = useState<Strategy[]>(defaultStrategies);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  const handleCreateStrategy = () => {
    const newStrategy: Strategy = {
      id: `strategy_${Date.now()}`,
      name: '新策略',
      description: '',
      targetSegment: '',
      channel: '短信',
      content: '',
      schedule: '',
      enabled: false,
    };
    const newStrategies = [...strategies, newStrategy];
    setStrategies(newStrategies);
    setSelectedStrategy(newStrategy);
    setIsEditing(true);
    onStrategiesChange?.(newStrategies);
  };

  const handleSelectStrategy = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setIsEditing(false);
  };

  const handleUpdateStrategy = (updated: Strategy) => {
    const newStrategies = strategies.map((s) =>
      s.id === updated.id ? updated : s
    );
    setStrategies(newStrategies);
    setSelectedStrategy(updated);
    onStrategiesChange?.(newStrategies);
  };

  const handleDeleteStrategy = (id: string) => {
    const newStrategies = strategies.filter((s) => s.id !== id);
    setStrategies(newStrategies);
    setSelectedStrategy(null);
    onStrategiesChange?.(newStrategies);
  };

  const handleDuplicateStrategy = (strategy: Strategy) => {
    const duplicated: Strategy = {
      ...strategy,
      id: `strategy_${Date.now()}`,
      name: `${strategy.name} (副本)`,
    };
    const newStrategies = [...strategies, duplicated];
    setStrategies(newStrategies);
    setSelectedStrategy(duplicated);
    onStrategiesChange?.(newStrategies);
  };

  const handleBatchEnable = (enabled: boolean) => {
    const newStrategies = strategies.map((s) => ({ ...s, enabled }));
    setStrategies(newStrategies);
    onStrategiesChange?.(newStrategies);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(strategies, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategies.json';
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as Strategy[];
          const newStrategies = [...strategies, ...imported];
          setStrategies(newStrategies);
          onStrategiesChange?.(newStrategies);
        } catch (err) {
          console.error('Failed to import strategies:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Panel - Strategy List */}
      <div className="w-80 border border-slate-200 rounded-lg flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700">策略列表</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowImportExport(!showImportExport)}>
              <Upload className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleCreateStrategy}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showImportExport && (
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <Label className="text-xs">导入策略文件</Label>
            <Input type="file" accept=".json" onChange={handleImport} className="mt-1" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleSelectStrategy(strategy)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedStrategy?.id === strategy.id
                  ? 'bg-indigo-50 border-2 border-indigo-200'
                  : 'bg-white border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700">{strategy.name}</span>
                {strategy.enabled && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">启用</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {strategy.description || '暂无描述'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {strategy.channel}
                </Badge>
                <span className="text-xs text-slate-400">{strategy.schedule}</span>
              </div>
            </button>
          ))}

          {strategies.length === 0 && (
            <EmptyState
              icon={Zap}
              title="暂无策略"
              description="点击右上角 + 按钮创建新策略"
            />
          )}
        </div>

        {strategies.length > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <Label className="text-sm">批量启用/禁用</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBatchEnable(true)}>
                  全部启用
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBatchEnable(false)}>
                  全部禁用
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Strategy Configuration */}
      <div className="flex-1">
        {selectedStrategy ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{selectedStrategy.name}</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <Save className="w-4 h-4" /> : '编辑'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicateStrategy(selectedStrategy)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteStrategy(selectedStrategy.id)}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label>策略名称</Label>
                <Input
                  value={selectedStrategy.name}
                  onChange={(e) =>
                    handleUpdateStrategy({ ...selectedStrategy, name: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label>描述</Label>
                <Textarea
                  value={selectedStrategy.description}
                  onChange={(e) =>
                    handleUpdateStrategy({ ...selectedStrategy, description: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>目标客群</Label>
                  <Input
                    value={selectedStrategy.targetSegment}
                    onChange={(e) =>
                      handleUpdateStrategy({ ...selectedStrategy, targetSegment: e.target.value })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label>触达渠道</Label>
                  <Select
                    value={selectedStrategy.channel}
                    onValueChange={(value) =>
                      handleUpdateStrategy({ ...selectedStrategy, channel: value })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="短信">短信</SelectItem>
                      <SelectItem value="电话">电话</SelectItem>
                      <SelectItem value="APP 推送">APP 推送</SelectItem>
                      <SelectItem value="微信">微信</SelectItem>
                      <SelectItem value="邮件">邮件</SelectItem>
                      <SelectItem value="客户经理">客户经理</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>营销内容</Label>
                <Textarea
                  value={selectedStrategy.content}
                  onChange={(e) =>
                    handleUpdateStrategy({ ...selectedStrategy, content: e.target.value })
                  }
                  disabled={!isEditing}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>执行时间</Label>
                  <Input
                    value={selectedStrategy.schedule}
                    onChange={(e) =>
                      handleUpdateStrategy({ ...selectedStrategy, schedule: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="例如：每周一 9:00"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedStrategy.enabled}
                      onCheckedChange={(checked) =>
                        handleUpdateStrategy({ ...selectedStrategy, enabled: checked })
                      }
                      disabled={!isEditing}
                    />
                    <Label>启用策略</Label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={Zap}
              title="选择策略"
              description="从左侧列表中选择一个策略来配置"
            />
          </Card>
        )}
      </div>
    </div>
  );
}

export default BatchStrategyConfig;
