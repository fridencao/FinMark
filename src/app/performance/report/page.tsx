import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, FileText, BarChart3, PieChart, TrendingUp, Filter, Search, Eye, Share, Printer, Mail, Edit3, FileJson, FileSpreadsheet, FileType } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app';
import { translations } from '@/i18n';
import { getReports, downloadReport, type Report } from '@/services/reports';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const reportTypes = [
  { id: 'summary', name: '汇总报告', description: '整体营销效果汇总', icon: 'BarChart3' },
  { id: 'scenario', name: '场景报告', description: '各场景效果分析', icon: 'FileText' },
  { id: 'channel', name: '渠道报告', description: '各渠道触达分析', icon: 'PieChart' },
  { id: 'customer', name: '客群报告', description: '客户响应分析', icon: 'TrendingUp' },
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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [emailRecipients, setEmailRecipients] = useState('');

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => getReports(),
  });
  const recentReports: Report[] = reportsData?.data ?? [];

  const t = translations[language].reportPage;

  const filteredReports = recentReports.filter(r => {
    const matchType = reportType === 'all' || r.type === reportType;
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  const handleExport = async () => {
    if (!selectedReport) return;
    try {
      const blob = await downloadReport(selectedReport.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport.name}.${exportFormat === 'csv' ? 'csv' : exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedReport) return;
    const downloadUrl = `${window.location.origin}/api/reports/${selectedReport.id}/download`;
    try {
      await navigator.clipboard.writeText(downloadUrl);
      alert(language === 'zh' ? '下载链接已复制到剪贴板' : 'Download link copied to clipboard');
      setShowShareDialog(false);
    } catch {
      prompt(language === 'zh' ? '请手动复制链接' : 'Copy this link', downloadUrl);
    }
  };

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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      {language === 'zh' ? '加载中...' : 'Loading...'}
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                      {t.noReports}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.type === 'summary' ? t.summary :
                           report.type === 'scenario' ? t.scenario :
                           report.type === 'channel' ? t.channel : t.customer}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.date ?? report.createdAt}</TableCell>
                      <TableCell>{report.size ?? '--'}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                          {report.status === 'completed' ? t.completed : t.generating}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedReport(report)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedReport(report); setShowExportDialog(true); }}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedReport(report); setShowShareDialog(true); }}>
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导出报告</DialogTitle>
            <DialogDescription>
              {selectedReport?.name} - 选择导出格式
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setExportFormat('pdf')}
              >
                <FileType className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-sm font-medium">PDF 格式</div>
                <div className="text-xs text-slate-500">适合打印和分享</div>
              </button>
              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'excel'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setExportFormat('excel')}
              >
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <div className="text-sm font-medium">Excel 格式</div>
                <div className="text-xs text-slate-500">适合数据分析</div>
              </button>
              <button
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'csv'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setExportFormat('csv')}
              >
                <FileJson className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">CSV 格式</div>
                <div className="text-xs text-slate-500">适合导入系统</div>
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Printer className="w-5 h-5 text-slate-400" />
              <div className="text-sm text-slate-600">
                导出后将自动下载到本地，可在下载文件夹查看
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              取消
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              导出为 {exportFormat.toUpperCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
      <DialogTitle>{t.shareLink}</DialogTitle>
          <DialogDescription>
            {selectedReport?.name} - {t.shareDownloadLink}
          </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <Share className="w-5 h-5 text-slate-400" />
              <div className="text-sm text-slate-600">
                {t.clickToCopy}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              {t.cancel}
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              {t.copyLink}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ReportCenterPage;
