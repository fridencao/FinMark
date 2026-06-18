import React, { useState } from 'react';
import {
  Clock, Plus, Pencil, Trash2, Search, Play, Pause,
  Calendar, Zap, History, Filter, ChevronRight
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  getTaskSchedules, getTaskSchedule, createTaskSchedule,
  updateTaskSchedule, deleteTaskSchedule, pauseTaskSchedule,
  resumeTaskSchedule, getScheduleHistory,
  TaskSchedule, TaskScheduleExecution, TriggerType, ScheduleStatus
} from '@/services/taskSchedule';

const TRIGGER_TYPES: { value: TriggerType; label: string; labelEn: string; color: string }[] = [
  { value: 'cron', label: '定时', labelEn: 'Scheduled', color: 'info' as const },
  { value: 'once', label: '单次', labelEn: 'One-time', color: 'secondary' as const },
  { value: 'event', label: '事件', labelEn: 'Event', color: 'warning' as const },
];

const CHANNELS = [
  { value: 'app_push', label: 'APP推送', labelEn: 'App Push' },
  { value: 'sms', label: '短信', labelEn: 'SMS' },
  { value: 'email', label: '邮件', labelEn: 'Email' },
  { value: 'wechat', label: '企业微信', labelEn: 'WeChat' },
  { value: 'outbound', label: '外呼', labelEn: 'Outbound' },
];

export function TaskSchedulePage() {
  const { language } = useAppStore();
  const [activeTab, setActiveTab] = useState('schedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TaskSchedule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [historyScheduleId, setHistoryScheduleId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    triggerType: 'cron' as TriggerType,
    channels: [] as string[],
    scenarioId: '',
    targetSegment: '',
    cronExpression: '',
    eventTrigger: '',
  });
  const [formError, setFormError] = useState('');

  const qc = useQueryClient();

  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['task-schedules', statusFilter, searchQuery],
    queryFn: () => getTaskSchedules({
      status: statusFilter === 'all' ? undefined : statusFilter as ScheduleStatus,
      limit: 100,
    }),
  });

  const { data: detailData } = useQuery({
    queryKey: ['task-schedule', historyScheduleId],
    queryFn: () => getTaskSchedule(historyScheduleId!),
    enabled: !!historyScheduleId,
  });

  const { data: historyData } = useQuery({
    queryKey: ['task-schedule-history', historyScheduleId],
    queryFn: () => getScheduleHistory(historyScheduleId!, { limit: 50 }),
    enabled: !!historyScheduleId && activeTab === 'history',
  });

  const createMutation = useMutation({
    mutationFn: createTaskSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-schedules'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err?.message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateTaskSchedule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-schedules'] });
      qc.invalidateQueries({ queryKey: ['task-schedule'] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err?.message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-schedules'] });
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: pauseTaskSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-schedules'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: resumeTaskSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task-schedules'] }),
  });

  function resetForm() {
    setEditingSchedule(null);
    setForm({ name: '', triggerType: 'cron', channels: [], scenarioId: '', targetSegment: '', cronExpression: '', eventTrigger: '' });
    setFormError('');
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(schedule: TaskSchedule) {
    setEditingSchedule(schedule);
    const config = (schedule.triggerConfig || {}) as any;
    setForm({
      name: schedule.name,
      triggerType: schedule.triggerType,
      channels: schedule.channels,
      scenarioId: schedule.scenarioId || '',
      targetSegment: schedule.targetSegment || '',
      cronExpression: config.cron || config.expression || '',
      eventTrigger: config.event || config.eventType || '',
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const triggerConfig: Record<string, unknown> = {};
    if (form.triggerType === 'cron') {
      triggerConfig.cron = form.cronExpression || '0 9 * * *';
    } else if (form.triggerType === 'event') {
      triggerConfig.event = form.eventTrigger || 'manual';
    }

    const payload = {
      name: form.name,
      triggerType: form.triggerType,
      triggerConfig,
      channels: form.channels,
      scenarioId: form.scenarioId || undefined,
      targetSegment: form.targetSegment || undefined,
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function confirmDelete(id: string) {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  }

  function executeDelete() {
    if (deleteTargetId) deleteMutation.mutate(deleteTargetId);
  }

  function openHistory(scheduleId: string) {
    setHistoryScheduleId(scheduleId);
    setActiveTab('history');
  }

  const t = translations[language].taskSchedulePage;

  const schedules = schedulesData?.data?.data || schedulesData?.data || [];
  const history = historyData?.data?.data || historyData?.data || [];
  const detail = detailData?.data?.data || detailData?.data;

  const getTriggerLabel = (type: TriggerType) => {
    const found = TRIGGER_TYPES.find(t => t.value === type);
    return found ? (language === 'zh' ? found.label : found.labelEn) : type;
  };

  const getTriggerColor = (type: TriggerType): 'info' | 'secondary' | 'warning' => {
    const found = TRIGGER_TYPES.find(t => t.value === type);
    return (found?.color as any) || 'secondary';
  };

  const getStatusLabel = (status: ScheduleStatus) => {
    switch (status) {
      case 'active': return t.active;
      case 'paused': return t.paused;
      case 'completed': return t.completed;
      default: return status;
    }
  };

  const getStatusVariant = (status: ScheduleStatus): 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  const toggleChannel = (channel: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(channel)
        ? f.channels.filter(c => c !== channel)
        : [...f.channels, channel],
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.subtitle}</p>
        </div>
        {activeTab === 'schedules' && (
          <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {t.create}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedules">
            <Clock className="w-4 h-4 mr-1.5" />
            {t.schedules}
          </TabsTrigger>
          <TabsTrigger value="history" disabled={!historyScheduleId}>
            <History className="w-4 h-4 mr-1.5" />
            {t.history}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    className="pl-9 w-64"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="w-4 h-4 mr-1.5" />
                    <SelectValue placeholder={t.allStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatus}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="paused">{t.paused}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-16 text-slate-400">{language === 'zh' ? '加载中...' : 'Loading...'}</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t.noData}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.name}</TableHead>
                    <TableHead>{t.triggerType}</TableHead>
                    <TableHead>{t.channels}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{language === 'zh' ? '最后执行' : 'Last Run'}</TableHead>
                    <TableHead>{language === 'zh' ? '下次执行' : 'Next Run'}</TableHead>
                    <TableHead className="text-right">{t.operation}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule: TaskSchedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        <Badge variant={getTriggerColor(schedule.triggerType)}>
                          {getTriggerLabel(schedule.triggerType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {schedule.channels.map(ch => {
                            const channelInfo = CHANNELS.find(c => c.value === ch);
                            return (
                              <Badge key={ch} variant="outline" className="text-xs">
                                {channelInfo ? (language === 'zh' ? channelInfo.label : channelInfo.labelEn) : ch}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(schedule.status)}>
                          {getStatusLabel(schedule.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {schedule.lastRunAt
                          ? new Date(schedule.lastRunAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {schedule.nextRunAt
                          ? new Date(schedule.nextRunAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {schedule.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => pauseMutation.mutate(schedule.id)}
                              disabled={pauseMutation.isPending}
                              title={t.pause}
                            >
                              <Pause className="w-4 h-4 text-amber-600" />
                            </Button>
                          )}
                          {schedule.status === 'paused' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resumeMutation.mutate(schedule.id)}
                              disabled={resumeMutation.isPending}
                              title={t.resume}
                            >
                              <Play className="w-4 h-4 text-emerald-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => openEdit(schedule)} title={t.editBtn}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openHistory(schedule.id)} title={t.historyBtn}>
                            <History className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => confirmDelete(schedule.id)} title={t.delete}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('schedules')}>
                  <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                  {t.backToList}
                </Button>
                {detail && (
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                    {detail.name} — {t.history}
                  </h3>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t.noHistory}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.executedAt}</TableHead>
                    <TableHead>{language === 'zh' ? '触发类型' : 'Trigger'}</TableHead>
                    <TableHead>{t.executionStatus}</TableHead>
                    <TableHead>{language === 'zh' ? '完成时间' : 'Completed At'}</TableHead>
                    <TableHead>{language === 'zh' ? '错误信息' : 'Error'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((exec: TaskScheduleExecution) => (
                    <TableRow key={exec.id}>
                      <TableCell className="text-sm">
                        {new Date(exec.startedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{exec.triggerType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            exec.status === 'success' ? 'success' :
                            exec.status === 'failed' ? 'error' :
                            exec.status === 'running' ? 'warning' : 'secondary'
                          }
                        >
                          {exec.status === 'success' ? t.success :
                           exec.status === 'failed' ? t.failed :
                           exec.status === 'running' ? t.running : t.pending}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {exec.completedAt
                          ? new Date(exec.completedAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                        {exec.error || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? t.edit : t.create}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="space-y-2">
              <Label>{t.name}</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.triggerType}</Label>
              <Select value={form.triggerType} onValueChange={v => setForm(f => ({ ...f, triggerType: v as TriggerType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(tt => (
                    <SelectItem key={tt.value} value={tt.value}>
                      {language === 'zh' ? tt.label : tt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.triggerType === 'cron' && (
              <div className="space-y-2">
                <Label>{t.cron}</Label>
                <Input
                  className="font-mono text-xs"
                  value={form.cronExpression}
                  onChange={e => setForm(f => ({ ...f, cronExpression: e.target.value }))}
                  placeholder={t.cronPlaceholder}
                />
              </div>
            )}

            {form.triggerType === 'event' && (
              <div className="space-y-2">
                <Label>{t.eventTrigger}</Label>
                <Input
                  value={form.eventTrigger}
                  onChange={e => setForm(f => ({ ...f, eventTrigger: e.target.value }))}
                  placeholder={t.eventPlaceholder}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t.selectChannels}</Label>
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map(ch => (
                  <Badge
                    key={ch.value}
                    variant={form.channels.includes(ch.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleChannel(ch.value)}
                  >
                    {language === 'zh' ? ch.label : ch.labelEn}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.scenario}</Label>
              <Input
                value={form.scenarioId}
                onChange={e => setForm(f => ({ ...f, scenarioId: e.target.value }))}
                placeholder={language === 'zh' ? '场景ID（可选）' : 'Scenario ID (optional)'}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.targetSegment}</Label>
              <Input
                value={form.targetSegment}
                onChange={e => setForm(f => ({ ...f, targetSegment: e.target.value }))}
                placeholder={language === 'zh' ? '目标客群标签（可选）' : 'Target segment tag (optional)'}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? t.saving : t.save}
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
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.saving : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaskSchedulePage;
