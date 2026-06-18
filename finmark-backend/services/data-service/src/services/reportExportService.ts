import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { prisma } from '../config/database.js';

const REPORTS_DIR = join(process.cwd(), 'reports');

export interface ReportExportConfig {
  dateRange: { start: string; end: string };
  type?: 'activity' | 'audience' | 'content' | 'channel';
  filters?: Record<string, unknown>;
}

interface ReportResult {
  fileName: string;
  filePath: string;
  sheetNames?: string[];
}

interface ExecutionRecord {
  actualReach: number | null;
  actualResponse: number | null;
  actualConversion: number | null;
  createdAt: Date;
  status: string;
  id: string;
  result: unknown;
  scenario: { title: string } | null;
}

interface AtomRecord {
  id: string;
  name: string;
  type: string;
  successRate: number | null;
  usageCount: number;
  tags: string[];
  status: string;
}

interface SegmentRecord {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

interface CustomerRecord {
  id: string;
  name: string;
  segment: string | null;
  asset: number | null;
  tags: string[];
}

export async function exportToExcel(config: ReportExportConfig): Promise<string> {
  const fileName = `report_export_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const executions = (await prisma.execution.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { scenario: true },
  })) as unknown as ExecutionRecord[];

  const totalReach = executions.reduce<number>((sum, e) => sum + (e.actualReach || 0), 0);
  const totalResponse = executions.reduce<number>((sum, e) => sum + (e.actualResponse || 0), 0);
  const totalConversion = executions.reduce<number>((sum, e) => sum + (e.actualConversion || 0), 0);

  summarySheet.addRow({ metric: 'Total Reach', value: totalReach });
  summarySheet.addRow({ metric: 'Total Response', value: totalResponse });
  summarySheet.addRow({ metric: 'Total Conversion', value: totalConversion });
  summarySheet.addRow({ metric: 'Response Rate', value: totalReach > 0 ? `${((totalResponse / totalReach) * 100).toFixed(2)}%` : '0%' });
  summarySheet.addRow({ metric: 'Conversion Rate', value: totalReach > 0 ? `${((totalConversion / totalReach) * 100).toFixed(2)}%` : '0%' });

  const detailSheet = workbook.addWorksheet('Details');
  detailSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Scenario', key: 'scenario', width: 30 },
    { header: 'Reach', key: 'reach', width: 12 },
    { header: 'Response', key: 'response', width: 12 },
    { header: 'Conversion', key: 'conversion', width: 12 },
  ];

  for (const exec of executions) {
    detailSheet.addRow({
      date: exec.createdAt.toISOString().split('T')[0],
      scenario: (exec.scenario as any)?.title || 'Unknown',
      reach: exec.actualReach || 0,
      response: exec.actualResponse || 0,
      conversion: exec.actualConversion || 0,
    });
  }

  await workbook.xlsx.writeFile(filePath);
  return fileName;
}

export async function exportToPDF(config: ReportExportConfig): Promise<string> {
  const fileName = `report_export_${Date.now()}.pdf`;
  const filePath = join(REPORTS_DIR, fileName);

  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const executions = await prisma.execution.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { scenario: true },
  }) as unknown as ExecutionRecord[];

  const totalReach = executions.reduce<number>((sum, e) => sum + (e.actualReach || 0), 0);
  const totalResponse = executions.reduce<number>((sum, e) => sum + (e.actualResponse || 0), 0);
  const totalConversion = executions.reduce<number>((sum, e) => sum + (e.actualConversion || 0), 0);

  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('FinMark Export Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('Performance Summary');
    doc.moveDown();

    const tableTop = doc.y;
    const tableLeft = 50;
    const cellHeight = 20;
    const col1Width = 150;
    const col2Width = 100;

    doc.font('Helvetica-Bold');
    doc.text('Metric', tableLeft, tableTop, { width: col1Width });
    doc.text('Value', tableLeft + col1Width, tableTop, { width: col2Width });

    doc.font('Helvetica');
    let y = tableTop + cellHeight;

    const metrics = [
      ['Total Reach', totalReach.toString()],
      ['Total Response', totalResponse.toString()],
      ['Total Conversion', totalConversion.toString()],
      ['Response Rate', totalReach > 0 ? `${((totalResponse / totalReach) * 100).toFixed(2)}%` : '0%'],
      ['Conversion Rate', totalReach > 0 ? `${((totalConversion / totalReach) * 100).toFixed(2)}%` : '0%'],
    ];

    for (const [label, value] of metrics) {
      doc.text(label, tableLeft, y, { width: col1Width });
      doc.text(value, tableLeft + col1Width, y, { width: col2Width });
      y += cellHeight;
    }

    doc.moveDown(2);
    doc.fontSize(14).text('Execution Details');
    doc.moveDown();

    const detailTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Date', tableLeft, detailTop, { width: 80 });
    doc.text('Scenario', tableLeft + 80, detailTop, { width: 150 });
    doc.text('Reach', tableLeft + 230, detailTop, { width: 60 });
    doc.text('Conv.', tableLeft + 290, detailTop, { width: 60 });

    doc.font('Helvetica');
    let dy = detailTop + cellHeight;
    for (const exec of executions) {
      if (dy > 750) {
        doc.addPage();
        dy = 50;
      }
      doc.text(exec.createdAt.toISOString().split('T')[0], tableLeft, dy, { width: 80 });
      doc.text((exec.scenario as any)?.title || 'Unknown', tableLeft + 80, dy, { width: 150 });
      doc.text((exec.actualReach || 0).toString(), tableLeft + 230, dy, { width: 60 });
      doc.text((exec.actualConversion || 0).toString(), tableLeft + 290, dy, { width: 60 });
      dy += cellHeight;
    }

    doc.end();

    stream.on('finish', () => resolve(fileName));
    stream.on('error', reject);
  });
}

export async function generateActivityReport(config: ReportExportConfig & { format: 'excel' | 'pdf' }): Promise<ReportResult> {
  if (config.format !== 'excel' && config.format !== 'pdf') {
    throw new Error('Unsupported format: use "excel" or "pdf"');
  }
  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const executions = await prisma.execution.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { scenario: true },
  }) as unknown as ExecutionRecord[];

  if (config.format === 'pdf') {
    const fileName = `activity_report_${Date.now()}.pdf`;
    const filePath = join(REPORTS_DIR, fileName);

    return new Promise<ReportResult>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('Activity Performance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
      doc.moveDown(2);

      const totalReach = executions.reduce<number>((s, e) => s + (e.actualReach || 0), 0);
      const totalResponse = executions.reduce<number>((s, e) => s + (e.actualResponse || 0), 0);
      const totalConversion = executions.reduce<number>((s, e) => s + (e.actualConversion || 0), 0);

      doc.fontSize(14).text('Summary');
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Executions: ${executions.length}`);
      doc.text(`Total Reach: ${totalReach}`);
      doc.text(`Total Response: ${totalResponse}`);
      doc.text(`Total Conversion: ${totalConversion}`);
      doc.moveDown(2);

      doc.fontSize(14).text('Activity Details');
      doc.moveDown();

      const tableTop = doc.y;
      const tableLeft = 50;
      doc.font('Helvetica-Bold');
      doc.text('Date', tableLeft, tableTop, { width: 80 });
      doc.text('Scenario', tableLeft + 80, tableTop, { width: 150 });
      doc.text('Status', tableLeft + 230, tableTop, { width: 60 });
      doc.text('Reach', tableLeft + 290, tableTop, { width: 60 });

      doc.font('Helvetica');
      let y = tableTop + 20;
      for (const exec of executions) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.text(exec.createdAt.toISOString().split('T')[0], tableLeft, y, { width: 80 });
        doc.text((exec.scenario as any)?.title || 'Unknown', tableLeft + 80, y, { width: 150 });
        doc.text(exec.status, tableLeft + 230, y, { width: 60 });
        doc.text((exec.actualReach || 0).toString(), tableLeft + 290, y, { width: 60 });
        y += 20;
      }

      doc.end();
      stream.on('finish', () => resolve({ fileName, filePath }));
      stream.on('error', reject);
    });
  }

  const fileName = `activity_report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';

  const summarySheet = workbook.addWorksheet('Activity Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  const totalReach = executions.reduce<number>((s, e) => s + (e.actualReach || 0), 0);
  const totalResponse = executions.reduce<number>((s, e) => s + (e.actualResponse || 0), 0);
  const totalConversion = executions.reduce<number>((s, e) => s + (e.actualConversion || 0), 0);

  summarySheet.addRow({ metric: 'Total Executions', value: executions.length });
  summarySheet.addRow({ metric: 'Total Reach', value: totalReach });
  summarySheet.addRow({ metric: 'Total Response', value: totalResponse });
  summarySheet.addRow({ metric: 'Total Conversion', value: totalConversion });
  summarySheet.addRow({ metric: 'Response Rate', value: totalReach > 0 ? `${((totalResponse / totalReach) * 100).toFixed(2)}%` : '0%' });
  summarySheet.addRow({ metric: 'Conversion Rate', value: totalReach > 0 ? `${((totalConversion / totalReach) * 100).toFixed(2)}%` : '0%' });

  const detailSheet = workbook.addWorksheet('Activity Details');
  detailSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Scenario', key: 'scenario', width: 30 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Reach', key: 'reach', width: 12 },
    { header: 'Response', key: 'response', width: 12 },
    { header: 'Conversion', key: 'conversion', width: 12 },
  ];

  for (const exec of executions) {
    detailSheet.addRow({
      id: exec.id,
      date: exec.createdAt.toISOString().split('T')[0],
      scenario: (exec.scenario as any)?.title || 'Unknown',
      status: exec.status,
      reach: exec.actualReach || 0,
      response: exec.actualResponse || 0,
      conversion: exec.actualConversion || 0,
    });
  }

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath, sheetNames: ['Activity Summary', 'Activity Details'] };
}

export async function generateAudienceReport(config: ReportExportConfig & { format: 'excel' | 'pdf' }): Promise<ReportResult> {
  const segments = (await prisma.audienceSegment.findMany({
    orderBy: { createdAt: 'desc' },
  })) as unknown as SegmentRecord[];
  const customers = (await prisma.customer.findMany()) as unknown as CustomerRecord[];

  if (config.format === 'pdf') {
    const fileName = `audience_report_${Date.now()}.pdf`;
    const filePath = join(REPORTS_DIR, fileName);

    return new Promise<ReportResult>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('Audience Segment Analysis Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Segments Overview');
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Segments: ${segments.length}`);
      doc.text(`Total Customers: ${customers.length}`);
      doc.moveDown(2);

      const tableLeft = 50;
      let y = doc.y;

      doc.font('Helvetica-Bold');
      doc.text('Segment', tableLeft, y, { width: 120 });
      doc.text('Description', tableLeft + 120, y, { width: 200 });
      doc.text('Status', tableLeft + 320, y, { width: 60 });

      doc.font('Helvetica');
      y += 20;
      for (const seg of segments) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.text(seg.name, tableLeft, y, { width: 120 });
        doc.text(seg.description || '-', tableLeft + 120, y, { width: 200 });
        doc.text(seg.status, tableLeft + 320, y, { width: 60 });
        y += 20;
      }

      doc.end();
      stream.on('finish', () => resolve({ fileName, filePath }));
      stream.on('error', reject);
    });
  }

  const fileName = `audience_report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';

  const segSheet = workbook.addWorksheet('Segments');
  segSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created', key: 'createdAt', width: 15 },
  ];

  for (const seg of segments) {
    segSheet.addRow({
      id: seg.id,
      name: seg.name,
      description: seg.description || '-',
      status: seg.status,
      createdAt: seg.createdAt.toISOString().split('T')[0],
    });
  }

  const custSheet = workbook.addWorksheet('Customers');
  custSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Segment', key: 'segment', width: 20 },
    { header: 'Asset', key: 'asset', width: 15 },
    { header: 'Tags', key: 'tags', width: 25 },
  ];

  for (const cust of customers) {
    custSheet.addRow({
      id: cust.id,
      name: cust.name,
      segment: cust.segment || '-',
      asset: cust.asset || 0,
      tags: (cust.tags || []).join(', '),
    });
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  summarySheet.addRow({ metric: 'Total Segments', value: segments.length });
  summarySheet.addRow({ metric: 'Active Segments', value: segments.filter(s => s.status === 'active').length });
  summarySheet.addRow({ metric: 'Total Customers', value: customers.length });

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath, sheetNames: ['Segments', 'Customers', 'Summary'] };
}

export async function generateContentReport(config: ReportExportConfig & { format: 'excel' | 'pdf' }): Promise<ReportResult> {
  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const contentAtoms = (await prisma.atom.findMany({
    where: { type: 'content' },
    orderBy: { usageCount: 'desc' },
  })) as unknown as AtomRecord[];

  const executions = await prisma.execution.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { scenario: true },
  }) as unknown as ExecutionRecord[];

  if (config.format === 'pdf') {
    const fileName = `content_report_${Date.now()}.pdf`;
    const filePath = join(REPORTS_DIR, fileName);

    return new Promise<ReportResult>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('Content Effectiveness Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Content Overview');
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Content Items: ${contentAtoms.length}`);
      doc.text(`Total Executions: ${executions.length}`);
      doc.moveDown(2);

      doc.fontSize(14).text('Content Performance');
      doc.moveDown();

      const tableLeft = 50;
      let y = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Name', tableLeft, y, { width: 140 });
      doc.text('Type', tableLeft + 140, y, { width: 60 });
      doc.text('Success Rate', tableLeft + 200, y, { width: 80 });
      doc.text('Usage', tableLeft + 280, y, { width: 60 });

      doc.font('Helvetica');
      y += 20;
      for (const atom of contentAtoms) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.text(atom.name, tableLeft, y, { width: 140 });
        doc.text(atom.type, tableLeft + 140, y, { width: 60 });
        doc.text(`${((atom.successRate || 0) * 100).toFixed(1)}%`, tableLeft + 200, y, { width: 80 });
        doc.text(atom.usageCount.toString(), tableLeft + 280, y, { width: 60 });
        y += 20;
      }

      doc.end();
      stream.on('finish', () => resolve({ fileName, filePath }));
      stream.on('error', reject);
    });
  }

  const fileName = `content_report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';

  const perfSheet = workbook.addWorksheet('Content Performance');
  perfSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Success Rate', key: 'successRate', width: 15 },
    { header: 'Usage Count', key: 'usageCount', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tags', key: 'tags', width: 30 },
  ];

  for (const atom of contentAtoms) {
    perfSheet.addRow({
      id: atom.id,
      name: atom.name,
      type: atom.type,
      successRate: `${((atom.successRate || 0) * 100).toFixed(1)}%`,
      usageCount: atom.usageCount,
      status: atom.status,
      tags: (atom.tags || []).join(', '),
    });
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  const avgSuccessRate = contentAtoms.length > 0
    ? contentAtoms.reduce<number>((s, a) => s + (a.successRate || 0), 0) / contentAtoms.length
    : 0;
  summarySheet.addRow({ metric: 'Total Content Items', value: contentAtoms.length });
  summarySheet.addRow({ metric: 'Active Content', value: contentAtoms.filter(a => a.status === 'active').length });
  summarySheet.addRow({ metric: 'Average Success Rate', value: `${(avgSuccessRate * 100).toFixed(1)}%` });
  summarySheet.addRow({ metric: 'Total Executions in Period', value: executions.length });

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath, sheetNames: ['Content Performance', 'Summary'] };
}

export async function generateChannelReport(config: ReportExportConfig & { format: 'excel' | 'pdf' }): Promise<ReportResult> {
  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const channels = (await prisma.atom.findMany({
    where: { type: 'channel' },
    orderBy: { usageCount: 'desc' },
  })) as unknown as AtomRecord[];

  const executions = await prisma.execution.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { scenario: true },
  }) as unknown as ExecutionRecord[];

  if (config.format === 'pdf') {
    const fileName = `channel_report_${Date.now()}.pdf`;
    const filePath = join(REPORTS_DIR, fileName);

    return new Promise<ReportResult>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text('Channel Performance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`${config.dateRange.start} to ${config.dateRange.end}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(14).text('Channel Overview');
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Total Channels: ${channels.length}`);
      doc.text(`Total Executions: ${executions.length}`);
      doc.moveDown(2);

      doc.fontSize(14).text('Channel Performance');
      doc.moveDown();

      const tableLeft = 50;
      let y = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Channel', tableLeft, y, { width: 120 });
      doc.text('Success Rate', tableLeft + 120, y, { width: 80 });
      doc.text('Usage', tableLeft + 200, y, { width: 60 });
      doc.text('Tags', tableLeft + 260, y, { width: 120 });

      doc.font('Helvetica');
      y += 20;
      for (const ch of channels) {
        if (y > 750) { doc.addPage(); y = 50; }
        doc.text(ch.name, tableLeft, y, { width: 120 });
        doc.text(`${((ch.successRate || 0) * 100).toFixed(1)}%`, tableLeft + 120, y, { width: 80 });
        doc.text(ch.usageCount.toString(), tableLeft + 200, y, { width: 60 });
        doc.text((ch.tags || []).join(', '), tableLeft + 260, y, { width: 120 });
        y += 20;
      }

      doc.end();
      stream.on('finish', () => resolve({ fileName, filePath }));
      stream.on('error', reject);
    });
  }

  const fileName = `channel_report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';

  const perfSheet = workbook.addWorksheet('Channel Performance');
  perfSheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Channel', key: 'name', width: 25 },
    { header: 'Success Rate', key: 'successRate', width: 15 },
    { header: 'Usage Count', key: 'usageCount', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tags', key: 'tags', width: 30 },
  ];

  for (const ch of channels) {
    perfSheet.addRow({
      id: ch.id,
      name: ch.name,
      successRate: `${((ch.successRate || 0) * 100).toFixed(1)}%`,
      usageCount: ch.usageCount,
      status: ch.status,
      tags: (ch.tags || []).join(', '),
    });
  }

  const execSheet = workbook.addWorksheet('Execution by Channel');
  execSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Scenario', key: 'scenario', width: 30 },
    { header: 'Channel', key: 'channel', width: 15 },
    { header: 'Reach', key: 'reach', width: 12 },
    { header: 'Response', key: 'response', width: 12 },
    { header: 'Conversion', key: 'conversion', width: 12 },
  ];

  for (const exec of executions) {
    const result = exec.result as Record<string, unknown> | null;
    execSheet.addRow({
      date: exec.createdAt.toISOString().split('T')[0],
      scenario: (exec.scenario as any)?.title || 'Unknown',
      channel: (result?.channel as string) || '-',
      reach: exec.actualReach || 0,
      response: exec.actualResponse || 0,
      conversion: exec.actualConversion || 0,
    });
  }

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  const totalReach = executions.reduce<number>((s, e) => s + (e.actualReach || 0), 0);
  const totalConversion = executions.reduce<number>((s, e) => s + (e.actualConversion || 0), 0);
  summarySheet.addRow({ metric: 'Total Channels', value: channels.length });
  summarySheet.addRow({ metric: 'Active Channels', value: channels.filter(c => c.status === 'active').length });
  summarySheet.addRow({ metric: 'Total Executions', value: executions.length });
  summarySheet.addRow({ metric: 'Total Reach', value: totalReach });
  summarySheet.addRow({ metric: 'Total Conversion', value: totalConversion });

  await workbook.xlsx.writeFile(filePath);
  return { fileName, filePath, sheetNames: ['Channel Performance', 'Execution by Channel', 'Summary'] };
}
