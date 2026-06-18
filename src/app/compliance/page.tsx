import React, { useState } from 'react';
import {
  Shield, Plus, Pencil, Trash2, Search, CheckCircle, XCircle,
  AlertTriangle, Ban, FileText, History, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  getForbiddenWords, createForbiddenWord, updateForbiddenWord,
  deleteForbiddenWord, toggleForbiddenWord,
  getComplianceRules, createComplianceRule, updateComplianceRule,
  deleteComplianceRule, toggleComplianceRule,
  checkCompliance, getComplianceLogs,
  ForbiddenWord, ComplianceRule, ComplianceLog
} from '@/services/compliance';

const CATEGORIES = [
  { value: 'prohibited', label: '禁用词', labelEn: 'Prohibited' },
  { value: 'restricted', label: '限制词', labelEn: 'Restricted' },
  { value: 'warning', label: '警示词', labelEn: 'Warning' },
  { value: 'sensitive', label: '敏感词', labelEn: 'Sensitive' },
  { value: 'political', label: '政治敏感', labelEn: 'Political' },
  { value: 'financial', label: '金融违规', labelEn: 'Financial' },
  { value: 'advertising', label: '广告违规', labelEn: 'Advertising' },
];

const SEVERITIES = [
  { value: 'low', label: '低', labelEn: 'Low', color: 'info' as const },
  { value: 'medium', label: '中', labelEn: 'Medium', color: 'warning' as const },
  { value: 'high', label: '高', labelEn: 'High', color: 'error' as const },
];

const RULE_ACTIONS = [
  { value: 'block', label: '拦截', labelEn: 'Block', color: 'error' as const },
  { value: 'warn', label: '警告', labelEn: 'Warn', color: 'warning' as const },
  { value: 'log', label: '记录', labelEn: 'Log', color: 'info' as const },
];

export function CompliancePage() {
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState('forbidden-words');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [forbiddenWordDialogOpen, setForbiddenWordDialogOpen] = useState(false);
  const [editingForbiddenWord, setEditingForbiddenWord] = useState<ForbiddenWord | null>(null);
  const [forbiddenWordForm, setForbiddenWordForm] = useState({
    word: '',
    category: 'prohibited',
    severity: 'medium' as 'low' | 'medium' | 'high',
    description: '',
  });
  const [forbiddenWordError, setForbiddenWordError] = useState('');

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    category: 'prohibited',
    description: '',
    pattern: '',
    action: 'block' as 'block' | 'warn' | 'log',
    priority: 1,
  });
  const [ruleError, setRuleError] = useState('');

  const [checkContent, setCheckContent] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'word' | 'rule'; id: string } | null>(null);

  const qc = useQueryClient();

  const { data: forbiddenWordsData, isLoading: loadingWords } = useQuery({
    queryKey: ['compliance', 'forbidden-words', categoryFilter, severityFilter, searchQuery],
    queryFn: () => getForbiddenWords({
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      severity: severityFilter === 'all' ? undefined : severityFilter,
      search: searchQuery || undefined,
    }),
  });

  const { data: rulesData, isLoading: loadingRules } = useQuery({
    queryKey: ['compliance', 'rules', categoryFilter, searchQuery],
    queryFn: () => getComplianceRules({
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      search: searchQuery || undefined,
    }),
  });

  const { data: logsData } = useQuery({
    queryKey: ['compliance', 'logs'],
    queryFn: () => getComplianceLogs(),
  });

  const createWordMutation = useMutation({
    mutationFn: createForbiddenWord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'forbidden-words'] });
      setForbiddenWordDialogOpen(false);
      resetWordForm();
    },
    onError: (err: any) => setForbiddenWordError(err?.message || 'Create failed'),
  });

  const updateWordMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ForbiddenWord> }) =>
      updateForbiddenWord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'forbidden-words'] });
      setForbiddenWordDialogOpen(false);
      resetWordForm();
    },
    onError: (err: any) => setForbiddenWordError(err?.message || 'Update failed'),
  });

  const deleteWordMutation = useMutation({
    mutationFn: deleteForbiddenWord,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'forbidden-words'] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
  });

  const toggleWordMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      toggleForbiddenWord(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'forbidden-words'] }),
  });

  const createRuleMutation = useMutation({
    mutationFn: createComplianceRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'rules'] });
      setRuleDialogOpen(false);
      resetRuleForm();
    },
    onError: (err: any) => setRuleError(err?.message || 'Create failed'),
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ComplianceRule> }) =>
      updateComplianceRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'rules'] });
      setRuleDialogOpen(false);
      resetRuleForm();
    },
    onError: (err: any) => setRuleError(err?.message || 'Update failed'),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: deleteComplianceRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance', 'rules'] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'enabled' | 'disabled' }) =>
      toggleComplianceRule(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance', 'rules'] }),
  });

  const checkMutation = useMutation({
    mutationFn: checkCompliance,
    onSuccess: (data) => setCheckResult(data?.data),
  });

  function resetWordForm() {
    setEditingForbiddenWord(null);
    setForbiddenWordForm({ word: '', category: 'prohibited', severity: 'medium', description: '' });
    setForbiddenWordError('');
  }

  function resetRuleForm() {
    setEditingRule(null);
    setRuleForm({ name: '', category: 'prohibited', description: '', pattern: '', action: 'block', priority: 1 });
    setRuleError('');
  }

  function openCreateWord() {
    resetWordForm();
    setForbiddenWordDialogOpen(true);
  }

  function openEditWord(word: ForbiddenWord) {
    setEditingForbiddenWord(word);
    setForbiddenWordForm({
      word: word.word,
      category: word.category,
      severity: word.severity,
      description: word.description,
    });
    setForbiddenWordDialogOpen(true);
  }

  function openCreateRule() {
    resetRuleForm();
    setRuleDialogOpen(true);
  }

  function openEditRule(rule: ComplianceRule) {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      category: rule.category,
      description: rule.description,
      pattern: rule.pattern,
      action: rule.action,
      priority: rule.priority,
    });
    setRuleDialogOpen(true);
  }

  function handleWordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForbiddenWordError('');
    if (editingForbiddenWord) {
      updateWordMutation.mutate({ id: editingForbiddenWord.id, data: forbiddenWordForm });
    } else {
      createWordMutation.mutate(forbiddenWordForm);
    }
  }

  function handleRuleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRuleError('');
    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleForm });
    } else {
      createRuleMutation.mutate(ruleForm);
    }
  }

  function handleCheck() {
    if (!checkContent.trim()) return;
    setCheckResult(null);
    checkMutation.mutate({ content: checkContent });
  }

  function confirmDelete(type: 'word' | 'rule', id: string) {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  }

  function executeDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'word') {
      deleteWordMutation.mutate(deleteTarget.id);
    } else {
      deleteRuleMutation.mutate(deleteTarget.id);
    }
  }

  const t = translations[language].compliancePage;

  const getCategoryLabel = (value: string) => {
    const cat = CATEGORIES.find(c => c.value === value);
    return cat ? (language === 'zh' ? cat.label : cat.labelEn) : value;
  };

  const getSeverityInfo = (value: string) => {
    const sev = SEVERITIES.find(s => s.value === value);
    return sev ? { label: language === 'zh' ? sev.label : sev.labelEn, color: sev.color } : { label: value, color: 'info' as const };
  };

  const getActionInfo = (value: string) => {
    const act = RULE_ACTIONS.find(a => a.value === value);
    return act ? { label: language === 'zh' ? act.label : act.labelEn, color: act.color } : { label: value, color: 'info' as const };
  };

  const words = forbiddenWordsData?.data?.data || forbiddenWordsData?.data || [];
  const rules = rulesData?.data?.data || rulesData?.data || [];
  const logs = logsData?.data?.data || logsData?.data || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forbidden-words">
            <Ban className="w-4 h-4 mr-1.5" />
            {t.forbiddenWords}
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Shield className="w-4 h-4 mr-1.5" />
            {t.rules}
          </TabsTrigger>
          <TabsTrigger value="check">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {t.check}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <History className="w-4 h-4 mr-1.5" />
            {t.logs}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forbidden-words" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9 w-64"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-1.5" />
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'zh' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder={t.severity} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {SEVERITIES.map(sev => (
                      <SelectItem key={sev.value} value={sev.value}>
                        {language === 'zh' ? sev.label : sev.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={openCreateWord}>
                <Plus className="w-4 h-4 mr-2" />
                {t.addWord}
              </Button>
            </div>

            {loadingWords ? (
              <div className="text-center py-16 text-slate-400">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
            ) : words.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Ban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t.noData}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.word}</TableHead>
                    <TableHead>{t.category}</TableHead>
                    <TableHead>{t.severity}</TableHead>
                    <TableHead>{t.description}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.operation}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {words.map((word: ForbiddenWord) => {
                    const sevInfo = getSeverityInfo(word.severity);
                    return (
                      <TableRow key={word.id}>
                        <TableCell className="font-medium">{word.word}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getCategoryLabel(word.category)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sevInfo.color}>{sevInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-500">{word.description}</TableCell>
                        <TableCell>
                          <Switch
                            checked={word.status === 'active'}
                            onCheckedChange={(checked) =>
                              toggleWordMutation.mutate({ id: word.id, status: checked ? 'active' : 'inactive' })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditWord(word)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => confirmDelete('word', word.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9 w-64"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-1.5" />
                    <SelectValue placeholder={t.category} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'zh' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={openCreateRule}>
                <Plus className="w-4 h-4 mr-2" />
                {t.addRule}
              </Button>
            </div>

            {loadingRules ? (
              <div className="text-center py-16 text-slate-400">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t.noData}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.ruleName}</TableHead>
                    <TableHead>{t.category}</TableHead>
                    <TableHead>{t.pattern}</TableHead>
                    <TableHead>{t.action}</TableHead>
                    <TableHead>{t.priority}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.operation}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: ComplianceRule) => {
                    const actInfo = getActionInfo(rule.action);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getCategoryLabel(rule.category)}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs text-slate-500">{rule.pattern}</TableCell>
                        <TableCell>
                          <Badge variant={actInfo.color}>{actInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{rule.priority}</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.status === 'enabled'}
                            onCheckedChange={(checked) =>
                              toggleRuleMutation.mutate({ id: rule.id, status: checked ? 'enabled' : 'disabled' })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditRule(rule)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => confirmDelete('rule', rule.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="check" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">{t.checkContent}</h3>
            <div className="space-y-4">
              <Textarea
                className="min-h-[200px] resize-y"
                placeholder={t.checkPlaceholder}
                value={checkContent}
                onChange={e => setCheckContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  onClick={handleCheck}
                  disabled={!checkContent.trim() || checkMutation.isPending}
                >
                  {checkMutation.isPending ? t.checking : t.startCheck}
                </Button>
              </div>

              {checkResult && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {checkResult.passed ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">{t.passed}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">
                          {t.violationCount.replace('{count}', String(checkResult.violations?.length || 0))}
                        </span>
                      </div>
                    )}
                  </div>

                  {checkResult.violations?.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{language === 'zh' ? '规则' : 'Rule'}</TableHead>
                          <TableHead>{t.category}</TableHead>
                          <TableHead>{t.severity}</TableHead>
                          <TableHead>{t.matchedContent}</TableHead>
                          <TableHead>{t.position}</TableHead>
                          <TableHead>{t.suggestion}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checkResult.violations.map((v: any, idx: number) => {
                          const sevInfo = getSeverityInfo(v.severity);
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{v.ruleName}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{getCategoryLabel(v.category)}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={sevInfo.color}>{sevInfo.label}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
                                {v.matchedContent}
                              </TableCell>
                              <TableCell className="text-xs text-slate-500">
                                [{v.position?.start}, {v.position?.end}]
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">{v.suggestion}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  {checkResult.passed && (
                    <div className="text-center py-8 text-emerald-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>{t.noViolations}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-slate-100">{t.logs}</h3>

            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t.noData}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'zh' ? '内容摘要' : 'Content Summary'}</TableHead>
                    <TableHead>{language === 'zh' ? '结果' : 'Result'}</TableHead>
                    <TableHead>{language === 'zh' ? '违规数' : 'Violations'}</TableHead>
                    <TableHead>{t.source}</TableHead>
                    <TableHead>{language === 'zh' ? '检查人' : 'Checked By'}</TableHead>
                    <TableHead>{t.time}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: ComplianceLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="max-w-[300px] truncate">{log.content}</TableCell>
                      <TableCell>
                        {log.passed ? (
                          <Badge variant="success">{t.passed}</Badge>
                        ) : (
                          <Badge variant="error">{t.failed}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{log.violationCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>{log.checkedBy}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(log.checkedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={forbiddenWordDialogOpen} onOpenChange={setForbiddenWordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingForbiddenWord ? t.editWord : t.addWord}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleWordSubmit} className="space-y-4">
            {forbiddenWordError && <p className="text-sm text-red-500">{forbiddenWordError}</p>}
            <div className="space-y-2">
              <Label>{t.word}</Label>
              <Input
                value={forbiddenWordForm.word}
                onChange={e => setForbiddenWordForm(f => ({ ...f, word: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.category}</Label>
                <Select value={forbiddenWordForm.category} onValueChange={v => setForbiddenWordForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'zh' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.severity}</Label>
                <Select value={forbiddenWordForm.severity} onValueChange={v => setForbiddenWordForm(f => ({ ...f, severity: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(sev => (
                      <SelectItem key={sev.value} value={sev.value}>
                        {language === 'zh' ? sev.label : sev.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.description}</Label>
              <Textarea
                value={forbiddenWordForm.description}
                onChange={e => setForbiddenWordForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForbiddenWordDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createWordMutation.isPending || updateWordMutation.isPending}>
                {createWordMutation.isPending || updateWordMutation.isPending ? t.saving : t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? t.editRule : t.addRule}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRuleSubmit} className="space-y-4">
            {ruleError && <p className="text-sm text-red-500">{ruleError}</p>}
            <div className="space-y-2">
              <Label>{t.ruleName}</Label>
              <Input
                value={ruleForm.name}
                onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.category}</Label>
                <Select value={ruleForm.category} onValueChange={v => setRuleForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'zh' ? cat.label : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.action}</Label>
                <Select value={ruleForm.action} onValueChange={v => setRuleForm(f => ({ ...f, action: v as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_ACTIONS.map(act => (
                      <SelectItem key={act.value} value={act.value}>
                        {language === 'zh' ? act.label : act.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t.pattern}</Label>
              <Input
                className="font-mono text-xs"
                value={ruleForm.pattern}
                onChange={e => setRuleForm(f => ({ ...f, pattern: e.target.value }))}
                placeholder={language === 'zh' ? '正则表达式或关键词' : 'Regex or keyword'}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.priority}</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={ruleForm.priority}
                  onChange={e => setRuleForm(f => ({ ...f, priority: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Input
                  value={ruleForm.description}
                  onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createRuleMutation.isPending || updateRuleMutation.isPending}>
                {createRuleMutation.isPending || updateRuleMutation.isPending ? t.saving : t.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.confirmDelete}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">{t.confirmDeleteMsg}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              disabled={deleteWordMutation.isPending || deleteRuleMutation.isPending}
            >
              {deleteWordMutation.isPending || deleteRuleMutation.isPending ? t.saving : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CompliancePage;
