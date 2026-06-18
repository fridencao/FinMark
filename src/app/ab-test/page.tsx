import React, { useState } from 'react';
import { FlaskConical, Plus, Play, Square, BarChart3, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  getAbTests, getAbTest, createAbTest, deleteAbTest,
  startAbTest, stopAbTest, recordConversion, getAbTestResults,
  AbTest, AbTestResult
} from '@/services/abTest';

const BRANCH_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  content: { zh: '内容测试', en: 'Content' },
  channel: { zh: '渠道测试', en: 'Channel' },
  timing: { zh: '时机测试', en: 'Timing' },
  segment: { zh: '客群测试', en: 'Segment' },
  strategy: { zh: '策略测试', en: 'Strategy' },
};

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'secondary'> = {
  draft: 'secondary',
  running: 'info',
  completed: 'success',
  paused: 'warning',
};

export default function AbTestPage() {
  const { language } = useAppStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [convDialogOpen, setConvDialogOpen] = useState(false);
  const [convBranchId, setConvBranchId] = useState('');
  const [convCount, setConvCount] = useState('1');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    type: 'content',
    metric: 'conversion_rate',
    branches: [
      { name: 'Control', traffic: 50 },
      { name: 'Variant A', traffic: 50 },
    ],
  });

  const qc = useQueryClient();

  const { data: testsData, isLoading } = useQuery({
    queryKey: ['ab-tests', statusFilter],
    queryFn: () => getAbTests(statusFilter === 'all' ? {} : { status: statusFilter }),
  });

  const { data: detailData } = useQuery({
    queryKey: ['ab-test', detailId],
    queryFn: () => getAbTest(detailId!),
    enabled: !!detailId,
  });

  const { data: resultsData } = useQuery({
    queryKey: ['ab-test-results', detailId],
    queryFn: () => getAbTestResults(detailId!),
    enabled: !!detailId && detailData?.data?.status === 'completed',
  });

  const createMutation = useMutation({
    mutationFn: createAbTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-tests'] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAbTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ab-tests'] }),
  });

  const startMutation = useMutation({
    mutationFn: startAbTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-tests'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['ab-test', detailId] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: stopAbTest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ab-tests'] });
      if (detailId) qc.invalidateQueries({ queryKey: ['ab-test', detailId] });
    },
  });

  const convMutation = useMutation({
    mutationFn: ({ branchId, count }: { branchId: string; count: number }) =>
      recordConversion(detailId!, { branchId, count }),
    onSuccess: () => {
      if (detailId) qc.invalidateQueries({ queryKey: ['ab-test', detailId] });
      setConvDialogOpen(false);
      setConvBranchId('');
      setConvCount('1');
    },
  });

  function resetCreateForm() {
    setCreateForm({
      name: '', description: '', type: 'content', metric: 'conversion_rate',
      branches: [{ name: 'Control', traffic: 50 }, { name: 'Variant A', traffic: 50 }],
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(createForm);
  }

  function addBranch() {
    setCreateForm(f => ({
      ...f,
      branches: [...f.branches, { name: `Variant ${String.fromCharCode(65 + f.branches.length - 1)}`, traffic: 0 }],
    }));
  }

  function removeBranch(idx: number) {
    if (createForm.branches.length <= 2) return;
    setCreateForm(f => ({ ...f, branches: f.branches.filter((_, i) => i !== idx) }));
  }

  const t = translations[language].abTestPage;

  const tests: AbTest[] = testsData?.data || [];
  const detail: AbTest | null = detailData?.data || null;
  const results: AbTestResult | null = resultsData?.data || null;

  if (detail) {
    const chartData = detail.branches.map(b => ({
      name: b.name,
      conversionRate: b.sampleSize > 0 ? (b.conversionCount / b.sampleSize) * 100 : 0,
      conversions: b.conversionCount,
      sampleSize: b.sampleSize,
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setDetailId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.back}
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{detail.name}</h2>
            <p className="text-sm text-slate-500">{detail.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[detail.status]}>
              {t[detail.status as keyof typeof t]}
            </Badge>
            {detail.status === 'draft' && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl" onClick={() => startMutation.mutate(detail.id)}>
                <Play className="w-4 h-4 mr-1" />{t.start}
              </Button>
            )}
            {detail.status === 'running' && (
              <>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setConvBranchId(''); setConvDialogOpen(true); }}>
                  {t.recordConv}
                </Button>
                <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => stopMutation.mutate(detail.id)}>
                  <Square className="w-4 h-4 mr-1" />{t.stop}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-500">{t.type}</span>
            <p className="text-sm font-medium mt-1">{TYPE_LABELS[detail.type]?.[language] || detail.type}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-500">{t.metric}</span>
            <p className="text-sm font-medium mt-1">{detail.metric}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-500">{t.branches_label}</span>
            <p className="text-sm font-medium mt-1">{detail.branches.length}</p>
          </Card>
          <Card className="p-4 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-500">{t.sampleSize}</span>
            <p className="text-sm font-medium mt-1">{detail.branches.reduce((s, b) => s + b.sampleSize, 0).toLocaleString()}</p>
          </Card>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">{t.results}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar dataKey="conversionRate" name={t.conversionRate} radius={[4, 4, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={BRANCH_COLORS[idx % BRANCH_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-slate-100">{t.branches}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3">{t.name}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.traffic}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.sampleSize}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.conversion}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3">{t.conversionRate}</th>
                </tr>
              </thead>
              <tbody>
                {detail.branches.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50">
                    <td className="py-3 font-medium text-sm">{b.name}</td>
                    <td className="py-3 text-sm text-right">{b.traffic}%</td>
                    <td className="py-3 text-sm text-right">{b.sampleSize.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">{b.conversionCount.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right font-medium">
                      {b.sampleSize > 0 ? ((b.conversionCount / b.sampleSize) * 100).toFixed(2) : '0.00'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {results && (
          <Card className="p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'zh' ? '统计分析' : 'Statistical Analysis'}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-slate-500">P-Value</span>
                <p className="text-lg font-bold mt-1">{results.pValue.toFixed(4)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">{t.significant}</span>
                <p className="mt-1">
                  <Badge variant={results.isSignificant ? 'success' : 'warning'}>
                    {results.isSignificant ? t.significant : t.notSignificant}
                  </Badge>
                </p>
              </div>
              {results.winnerBranchId && (
                <div>
                  <span className="text-xs text-slate-500">{t.winner}</span>
                  <p className="text-lg font-bold mt-1 text-emerald-600">
                    {results.branches.find(b => b.id === results.winnerBranchId)?.name || '—'}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-slate-500">{language === 'zh' ? '最高置信度' : 'Max Confidence'}</span>
                <p className="text-lg font-bold mt-1">
                  {Math.max(...results.branches.map(b => b.confidence)).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        <Dialog open={convDialogOpen} onOpenChange={setConvDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.recordConv}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.branch}</Label>
                <Select value={convBranchId} onValueChange={setConvBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.branch} />
                  </SelectTrigger>
                  <SelectContent>
                    {detail.branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.count}</Label>
                <Input type="number" min="1" value={convCount} onChange={e => setConvCount(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConvDialogOpen(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!convBranchId || convMutation.isPending}
                onClick={() => convMutation.mutate({ branchId: convBranchId, count: Number(convCount) || 1 })}
              >
                {convMutation.isPending ? (language === 'zh' ? '提交中...' : 'Submitting...') : (language === 'zh' ? '提交' : 'Submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t.create}
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">{t.all}</TabsTrigger>
          <TabsTrigger value="draft">{t.draft}</TabsTrigger>
          <TabsTrigger value="running">{t.running}</TabsTrigger>
          <TabsTrigger value="completed">{t.completed}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-0 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
        ) : tests.length === 0 ? (
          <div className="p-16 text-center">
            <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-600 dark:text-slate-400">{t.noTests}</p>
            <p className="text-sm text-slate-400 mt-1">{t.noTestsDesc}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.name}</th>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.type}</th>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.metric}</th>
                  <th className="text-center text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.branches_label}</th>
                  <th className="text-center text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.status}</th>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.createdAt}</th>
                  <th className="text-right text-xs font-bold text-slate-400 uppercase py-3 px-4">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{test.name}</div>
                      {test.description && (
                        <div className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{test.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[test.type]?.[language] || test.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{test.metric}</td>
                    <td className="py-4 px-4 text-center text-sm">{test.branches.length}</td>
                    <td className="py-4 px-4 text-center">
                      <Badge variant={STATUS_VARIANT[test.status]}>
                        {t[test.status as keyof typeof t]}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(test.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {test.status === 'draft' && (
                          <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => startMutation.mutate(test.id)}>
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {test.status === 'running' && (
                          <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => stopMutation.mutate(test.id)}>
                            <Square className="w-4 h-4" />
                          </Button>
                        )}
                        {test.status === 'draft' && (
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => {
                            if (window.confirm(t.confirmDelete)) deleteMutation.mutate(test.id);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.create}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {createMutation.isError && (
              <p className="text-sm text-red-500">{(createMutation.error as Error)?.message}</p>
            )}
            <div className="space-y-2">
              <Label>{t.testName}</Label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.testDesc}</Label>
              <Textarea
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.testType}</Label>
                <Select value={createForm.type} onValueChange={v => setCreateForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v[language]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t.metric}</Label>
                <Select value={createForm.metric} onValueChange={v => setCreateForm(f => ({ ...f, metric: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversion_rate">{t.conversionRate}</SelectItem>
                    <SelectItem value="click_rate">{t.clickRate}</SelectItem>
                    <SelectItem value="open_rate">{t.openRate}</SelectItem>
                    <SelectItem value="response_rate">{t.responseRate}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t.branches}</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addBranch}>
                  <Plus className="w-3 h-3 mr-1" />{t.addBranch}
                </Button>
              </div>
              <div className="space-y-2">
                {createForm.branches.map((branch, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRANCH_COLORS[idx % BRANCH_COLORS.length] }} />
                    <Input
                      className="flex-1"
                      value={branch.name}
                      onChange={e => setCreateForm(f => {
                        const branches = [...f.branches];
                        branches[idx] = { ...branches[idx], name: e.target.value };
                        return { ...f, branches };
                      })}
                      placeholder={`${language === 'zh' ? '分支' : 'Branch'} ${idx + 1}`}
                    />
                    <Input
                      className="w-20"
                      type="number"
                      min="0"
                      max="100"
                      value={branch.traffic}
                      onChange={e => setCreateForm(f => {
                        const branches = [...f.branches];
                        branches[idx] = { ...branches[idx], traffic: Number(e.target.value) };
                        return { ...f, branches };
                      })}
                    />
                    {createForm.branches.length > 2 && (
                      <Button type="button" variant="ghost" size="sm" className="text-red-500 px-2" onClick={() => removeBranch(idx)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending}>
                {createMutation.isPending ? (language === 'zh' ? '创建中...' : 'Creating...') : (language === 'zh' ? '创建' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
