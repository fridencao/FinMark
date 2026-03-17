import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, FileText, BarChart3, PieChart, TrendingUp, Filter, Search, Eye, Share, Printer, Mail, Edit3 } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const reportTypes = [
  { id: 'summary', name: '汇总报告', description: '整体营销效果汇总', icon: 'BarChart3' },
  { id: 'scenario', name: '场景报告', description: '各场景效果分析', icon: 'FileText' },
  { id: 'channel', name: '渠道报告', description: '各渠道触达分析', icon: 'PieChart' },
  { id: 'customer', name: '客群报告', description: '客户响应分析', icon: 'TrendingUp' },
];

const recentReports = [
  { id: 'r001', name: '2024年1月营销效果汇总', type: 'summary', date: '2024-01-31', size: '2.4MB', status: 'completed' },
  { id: 'r002', name: '流失挽回场景月度报告', type: 'scenario', date: '2024-01-28', size: '1.8MB', status: 'completed' },
  { id: 'r003', name: '渠道触达效率分析', type: 'channel', date: '2024-01-25', size: '1.2MB', status: 'completed' },
  { id: 'r004', name: 'VIP客户响应分析', type: 'customer', date: '2024-01-20', size: '3.1MB', status: 'completed' },
  { id: 'r005', name: 'Q1营销效果预测', type: 'summary', date: '2024-01-15', size: '1.5MB', status: 'generating' },
];

const scheduledReports = [
  { id: 's001', name: '周报', frequency: '每周一', nextRun: '2024-02-05', recipients: 5 },
  { id: 's002', name: '月报', frequency: '每月1日', nextRun: '2024-02-01', recipients: 10 },
  { id: 's003', name: '季报', frequency: '每季度', nextRun: '2024-04-01', recipients: 15 },
];

export function ReportCenterPage() {
  const { language } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const [reportType, setReportType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const t = language === 'zh' ? {
    title: '报表中心',
    subtitle: '查看和管理营销效果报告',
    create: '创建报告',
    download: '下载',
    view: '查看',
    share: '分享',
    schedule: '定时报告',
    reports: '报告列表',
    scheduled: '定时任务',
    templates: '报告模板',
    all: '全部',
    summary: '汇总',
    scenario: '场景',
    channel: '渠道',
    customer: '客群',
    name: '报告名称',
    type: '类型',
    date: '日期',
    size: '大小',
    status: '状态',
    completed: '已完成',
    generating: '生成中',
    frequency: '频率',
    nextRun: '下次运行',
    recipients: '接收人',
    searchPlaceholder: '搜索报告...',
    noReports: '暂无报告',
  } : {
    title: 'Report Center',
    subtitle: 'View and manage marketing reports',
    create: 'Create Report',
    download: 'Download',
    view: 'View',
    share: 'Share',
    schedule: 'Scheduled Reports',
    reports: 'Reports',
    scheduled: 'Scheduled',
    templates: 'Templates',
    all: 'All',
    summary: 'Summary',
    scenario: 'Scenario',
    channel: 'Channel',
    customer: 'Customer',
    name: 'Name',
    type: 'Type',
    date: 'Date',
    size: 'Size',
    status: 'Status',
    completed: 'Completed',
    generating: 'Generating',
    frequency: 'Frequency',
    nextRun: 'Next Run',
    recipients: 'Recipients',
    searchPlaceholder: 'Search reports...',
    noReports: 'No reports',
  };

  const filteredReports = recentReports.filter(r => {
    const matchType = reportType === 'all' || r.type === reportType;
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="px-6 py-3">
            <Calendar className="w-5 h-5 mr-2" />
            {t.schedule}
          </Button>
          <Button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.create}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {reportTypes.map((type) => (
          <Card key={type.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold">{recentReports.filter(r => r.type === type.id).length}</p>
                <p className="text-xs text-slate-500">{type.name}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">{t.reports}</TabsTrigger>
          <TabsTrigger value="scheduled">{t.scheduled}</TabsTrigger>
          <TabsTrigger value="templates">{t.templates}</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4 mt-6">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-10"
              />
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="summary">{t.summary}</SelectItem>
                <SelectItem value="scenario">{t.scenario}</SelectItem>
                <SelectItem value="channel">{t.channel}</SelectItem>
                <SelectItem value="customer">{t.customer}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.size}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.type === 'summary' ? t.summary : 
                         report.type === 'scenario' ? t.scenario :
                         report.type === 'channel' ? t.channel : t.customer}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.size}</TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status === 'completed' ? t.completed : t.generating}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.frequency}</TableHead>
                  <TableHead>{t.nextRun}</TableHead>
                  <TableHead>{t.recipients}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{report.frequency}</TableCell>
                    <TableCell>{report.nextRun}</TableCell>
                    <TableCell>{report.recipients}人</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <Mail className="w-4 h-4 mr-1" />
                          测试
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            {reportTypes.map((type) => (
              <Card key={type.id} className="p-6 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Button variant="outline" size="sm">使用</Button>
                </div>
                <h4 className="font-bold mb-1">{type.name}</h4>
                <p className="text-sm text-slate-500">{type.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ReportCenterPage;
