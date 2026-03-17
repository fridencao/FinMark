import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Eye, FileText, Save, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';

interface Template {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'push' | 'wechat' | 'call';
  category: string;
  content: string;
  variables: string[];
  description: string;
  isSystem: boolean;
}

interface TemplateManagerProps {
  onTemplatesChange?: (templates: Template[]) => void;
}

const defaultTemplates: Template[] = [
  {
    id: '1',
    name: '新客欢迎短信',
    type: 'sms',
    category: '客户欢迎',
    content: '尊敬的{customerName}，欢迎您成为我行客户！我们将竭诚为您提供优质金融服务。',
    variables: ['customerName'],
    description: '用于新客户开户后的欢迎短信',
    isSystem: true,
  },
  {
    id: '2',
    name: '理财产品到期提醒',
    type: 'sms',
    category: '产品提醒',
    content: '尊敬的{customerName}，您持有的{productName}将于{expiryDate}到期，请及时处理。',
    variables: ['customerName', 'productName', 'expiryDate'],
    description: '理财产品到期前发送给客户的提醒',
    isSystem: true,
  },
  {
    id: '3',
    name: '生日祝福邮件',
    type: 'email',
    category: '客户关怀',
    content: '亲爱的{customerName}：\n\n今天是您的生日，祝您生日快乐！\n\n为您准备了专属礼遇，详情请联系您的客户经理。',
    variables: ['customerName'],
    description: '客户生日当天发送的祝福邮件',
    isSystem: false,
  },
];

const templateTypes = [
  { type: 'sms', label: '短信', icon: FileText },
  { type: 'email', label: '邮件', icon: FileText },
  { type: 'push', label: 'APP 推送', icon: FileText },
  { type: 'wechat', label: '微信', icon: FileText },
  { type: 'call', label: '电话脚本', icon: FileText },
];

const categories = [
  '客户欢迎',
  '产品提醒',
  '客户关怀',
  '营销活动',
  '风险通知',
  '其他',
];

export function TemplateManager({ onTemplatesChange }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: '新模板',
      type: 'sms',
      category: '其他',
      content: '',
      variables: [],
      description: '',
      isSystem: false,
    });
    setIsDialogOpen(true);
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsEditing(false);
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      setEditingTemplate({ ...selectedTemplate });
      setIsDialogOpen(true);
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate.name) return;

    const variables = extractVariables(editingTemplate.content || '');

    if (selectedTemplate) {
      // Update existing
      const updated: Template = {
        ...selectedTemplate,
        ...editingTemplate,
        variables,
      } as Template;
      const newTemplates = templates.map((t) =>
        t.id === selectedTemplate.id ? updated : t
      );
      setTemplates(newTemplates);
      setSelectedTemplate(updated);
      onTemplatesChange?.(newTemplates);
    } else {
      // Create new
      const newTemplate: Template = {
        id: `template_${Date.now()}`,
        ...editingTemplate,
        variables,
      } as Template;
      const newTemplates = [...templates, newTemplate];
      setTemplates(newTemplates);
      setSelectedTemplate(newTemplate);
      onTemplatesChange?.(newTemplates);
    }

    setIsDialogOpen(false);
    setEditingTemplate({});
  };

  const handleDeleteTemplate = (id: string) => {
    const newTemplates = templates.filter((t) => t.id !== id);
    setTemplates(newTemplates);
    setSelectedTemplate(null);
    onTemplatesChange?.(newTemplates);
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicated: Template = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (副本)`,
      isSystem: false,
    };
    const newTemplates = [...templates, duplicated];
    setTemplates(newTemplates);
    setSelectedTemplate(duplicated);
    onTemplatesChange?.(newTemplates);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'templates.json';
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as Template[];
          const newTemplates = [...templates, ...imported];
          setTemplates(newTemplates);
          onTemplatesChange?.(newTemplates);
        } catch (err) {
          console.error('Failed to import templates:', err);
        }
      };
      reader.readAsText(file);
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesType = filterType === 'all' || template.type === filterType;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    const typeInfo = templateTypes.find((t) => t.type === type);
    return (
      <Badge variant="outline" className="text-xs">
        {typeInfo?.label || type}
      </Badge>
    );
  };

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Left Panel - Template List */}
      <div className="w-80 border border-slate-200 rounded-lg flex flex-col">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">模板列表</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" asChild>
                <label>
                  <Upload className="w-4 h-4" />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </Button>
              <Button size="sm" onClick={handleCreateTemplate}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {templateTypes.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="text"
            placeholder="搜索模板..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedTemplate?.id === template.id
                  ? 'bg-indigo-50 border-2 border-indigo-200'
                  : 'bg-white border-2 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-slate-700">
                  {template.name}
                </span>
                {template.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    系统
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getTypeBadge(template.type)}
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {template.description || '暂无描述'}
              </p>
            </button>
          ))}

          {filteredTemplates.length === 0 && (
            <EmptyState
              icon={FileText}
              title="暂无模板"
              description="点击右上角 + 按钮创建新模板"
            />
          )}
        </div>
      </div>

      {/* Right Panel - Template Preview/Edit */}
      <div className="flex-1">
        {selectedTemplate ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">{selectedTemplate.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeBadge(selectedTemplate.type)}
                  <Badge variant="outline">{selectedTemplate.category}</Badge>
                  {selectedTemplate.isSystem && (
                    <Badge variant="secondary">系统模板</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selectedTemplate.isSystem && (
                  <>
                    <Button size="sm" variant="outline" onClick={handleEditTemplate}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateTemplate(selectedTemplate)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                  预览
                </Button>
              </div>
            </div>

            <Tabs defaultValue="content" className="space-y-4">
              <TabsList>
                <TabsTrigger value="content">模板内容</TabsTrigger>
                <TabsTrigger value="variables">变量列表</TabsTrigger>
                <TabsTrigger value="info">基本信息</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Label>模板内容</Label>
                <Textarea
                  value={selectedTemplate.content}
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-2">
                  使用 {'{'}变量名{'}'} 格式插入变量，例如：{'{'}customerName{'}'}
                </p>
              </TabsContent>

              <TabsContent value="variables">
                <Label>可用变量</Label>
                {selectedTemplate.variables.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {'{'}
                        {variable}
                        {'}'}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mt-2">暂无变量</p>
                )}
              </TabsContent>

              <TabsContent value="info">
                <div className="space-y-4">
                  <div>
                    <Label>描述</Label>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedTemplate.description || '暂无描述'}
                    </p>
                  </div>
                  <div>
                    <Label>模板 ID</Label>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {selectedTemplate.id}
                    </code>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={FileText}
              title="选择模板"
              description="从左侧列表中选择一个模板"
            />
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? '编辑模板' : '创建新模板'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板名称</Label>
                <Input
                  value={editingTemplate.name || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="输入模板名称"
                />
              </div>
              <div>
                <Label>分类</Label>
                <Select
                  value={editingTemplate.category || ''}
                  onValueChange={(value) =>
                    setEditingTemplate({ ...editingTemplate, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>模板类型</Label>
                <Select
                  value={editingTemplate.type || 'sms'}
                  onValueChange={(value) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      type: value as Template['type'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((t) => (
                      <SelectItem key={t.type} value={t.type}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>描述</Label>
                <Input
                  value={editingTemplate.description || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, description: e.target.value })
                  }
                  placeholder="模板用途描述"
                />
              </div>
            </div>

            <div>
              <Label>模板内容</Label>
              <Textarea
                value={editingTemplate.content || ''}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, content: e.target.value })
                }
                rows={6}
                className="font-mono text-sm"
                placeholder="输入模板内容，使用 {'{'}变量名{'}'} 格式插入变量"
              />
              {editingTemplate.content && (
                <div className="mt-2">
                  <Label className="text-xs">识别到的变量：</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {extractVariables(editingTemplate.content).map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {'{'}
                        {variable}
                        {'}'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateManager;
