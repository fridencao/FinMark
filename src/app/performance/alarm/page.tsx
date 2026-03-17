import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, AlertTriangle, CheckCircle, XCircle, Clock, Settings, Search, Filter, Plus, Eye, Edit3, Trash2, Volume2, VolumeX, Mail, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const alarmRules = [
  { id: 'a001', name: '触达率低于阈值', metric: '触达率', condition: '<', threshold: 50, level: 'warning', enabled: true, channels: ['APP推送', '短信'] },
  { id: 'a002', name: '转化率异常下降', metric: '转化率', condition: '<', threshold: 5, level: 'critical', enabled: true, channels: ['全渠道'] },
  { id: 'a003', name: '客户投诉激增', metric: '投诉数', condition: '>', threshold: 10, level: 'critical', enabled: true, channels: ['外呼', '短信'] },
  { id: 'a004', name: 'ROI低于预期', metric: 'ROI', condition: '<', threshold: 2, level: 'warning', enabled: false, channels: ['全渠道'] },
  { id: 'a005', name: '合规风险提示', metric: '合规评分', condition: '<', threshold: 80, level: 'critical', enabled: true, channels: ['全渠道'] },
];

const alarmHistory = [
  { id: 'h001', rule: '触达率低于阈值', time: '2024-01-28 14:30', status: 'triggered', value: 42, threshold: 50, acknowledged: false },
  { id: 'h002', rule: '转化率异常下降', time: '2024-01-28 10:15', status: 'resolved', value: 3.2, threshold: 5, acknowledged: true },
  { id: 'h003', rule: '合规风险提示', time: '2024-01-27 16:45', status: 'triggered', value: 75, threshold: 80, acknowledged: false },
  { id: 'h004', rule: 'ROI低于预期', time: '2024-01-27 09:00', status: 'resolved', value: 1.8, threshold: 2, acknowledged: true },
  { id: 'h005', rule: '客户投诉激增', time: '2024-01-26 11:20', status: 'triggered', value: 15, threshold: 10, acknowledged: true },
];

export function AlarmManagementPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState(alarmRules);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const t = language === 'zh' ? {
    title: '告警管理',
    subtitle: '配置监控告警规则',
    create: '创建规则',
    rules: '告警规则',
    historyTab: '告警历史',
    settings: '通知设置',
    name: '规则名称',
    metric: '监控指标',
    condition: '条件',
    threshold: '阈值',
    level: '级别',
    channel: '渠道',
    status: '状态',
    enabled: '已启用',
    disabled: '已停用',
    warning: '警告',
    critical: '严重',
    historyRecord: '历史记录',
    time: '时间',
    value: '实际值',
    acknowledge: '确认',
    acknowledged: '已确认',
    unacknowledged: '未确认',
    resolved: '已解决',
    triggered: '触发中',
    searchPlaceholder: '搜索规则...',
    notification: '通知方式',
    email: '邮件',
    sms: '短信',
    wechat: '企业微信',
    frequency: '通知频率',
    mute: '静音',
  } : {
    title: 'Alarm Management',
    subtitle: 'Configure monitoring alarm rules',
    create: 'Create Rule',
    rules: 'Alarm Rules',
    historyTab: 'History',
    settings: 'Settings',
    name: 'Name',
    metric: 'Metric',
    condition: 'Condition',
    threshold: 'Threshold',
    level: 'Level',
    channel: 'Channel',
    status: 'Status',
    enabled: 'Enabled',
    disabled: 'Disabled',
    warning: 'Warning',
    critical: 'Critical',
    historyRecord: 'History',
    time: 'Time',
    value: 'Value',
    acknowledge: 'Acknowledge',
    acknowledged: 'Acknowledged',
    unacknowledged: 'Unacknowledged',
    resolved: 'Resolved',
    triggered: 'Triggered',
    searchPlaceholder: 'Search rules...',
    notification: 'Notification',
    email: 'Email',
    sms: 'SMS',
    wechat: 'WeChat',
    frequency: 'Frequency',
    mute: 'Mute',
  };

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <Button 
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="w-5 h-5" />
          {t.create}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</p>
              <p className="text-xs text-slate-500">{t.enabled}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alarmHistory.filter(h => h.status === 'triggered' && !h.acknowledged).length}</p>
              <p className="text-xs text-slate-500">{t.triggered}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alarmHistory.filter(h => h.status === 'resolved').length}</p>
              <p className="text-xs text-slate-500">{t.resolved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alarmHistory.length}</p>
              <p className="text-xs text-slate-500">总告警数</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">{t.rules}</TabsTrigger>
          <TabsTrigger value="history">{t.historyTab}</TabsTrigger>
          <TabsTrigger value="settings">{t.settings}</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10"
            />
          </div>

          {/* Rules Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.metric}</TableHead>
                  <TableHead>{t.condition}</TableHead>
                  <TableHead>{t.threshold}</TableHead>
                  <TableHead>{t.level}</TableHead>
                  <TableHead>{t.channel}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>{rule.metric}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.condition} {rule.threshold}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.level === 'critical' ? 'destructive' : 'secondary'}>
                        {rule.level === 'critical' ? t.critical : t.warning}
                      </Badge>
                    </TableCell>
                    <TableCell>{rule.channels.join(', ')}</TableCell>
                    <TableCell>
                      <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-rose-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.time}</TableHead>
                  <TableHead>{t.value}</TableHead>
                  <TableHead>{t.threshold}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.acknowledge}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarmHistory.map((alarm) => (
                  <TableRow key={alarm.id}>
                    <TableCell className="font-medium">{alarm.rule}</TableCell>
                    <TableCell className="text-sm text-slate-500">{alarm.time}</TableCell>
                    <TableCell>
                      <span className={alarm.status === 'triggered' ? 'text-rose-600 font-medium' : ''}>
                        {alarm.value}
                      </span>
                    </TableCell>
                    <TableCell>{alarm.threshold}</TableCell>
                    <TableCell>
                      <Badge variant={alarm.status === 'triggered' ? 'destructive' : 'default'}>
                        {alarm.status === 'triggered' ? t.triggered : t.resolved}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={alarm.acknowledged ? 'outline' : 'secondary'}>
                        {alarm.acknowledged ? t.acknowledged : t.unacknowledged}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!alarm.acknowledged && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t.acknowledge}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card className="p-6 space-y-6">
            <h4 className="font-bold">{t.notification}</h4>
            <div className="space-y-4">
              {[
                { id: 'email', name: t.email, icon: 'Mail' },
                { id: 'sms', name: t.sms, icon: 'Bell' },
                { id: 'wechat', name: t.wechat, icon: 'MessageSquare' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t">
              <h4 className="font-bold mb-4">{t.frequency}</h4>
              <Select defaultValue="immediate">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">实时</SelectItem>
                  <SelectItem value="hourly">每小时汇总</SelectItem>
                  <SelectItem value="daily">每天汇总</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.create}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t.name}</label>
              <Input placeholder="输入规则名称" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t.metric}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择指标" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reach_rate">触达率</SelectItem>
                    <SelectItem value="conversion">转化率</SelectItem>
                    <SelectItem value="roi">ROI</SelectItem>
                    <SelectItem value="complaint">投诉数</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t.level}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">{t.warning}</SelectItem>
                    <SelectItem value="critical">{t.critical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t.condition}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择条件" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<">小于 (&lt;)</SelectItem>
                    <SelectItem value=">">大于 (&gt;)</SelectItem>
                    <SelectItem value="=">等于 (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t.threshold}</label>
                <Input type="number" placeholder="输入阈值" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button onClick={() => setShowCreateDialog(false)}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AlarmManagementPage;
