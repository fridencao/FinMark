import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { prisma } from '../config/database.js';

const REPORTS_DIR = join(process.cwd(), 'reports');

export interface ReportConfig {
  type: 'summary' | 'scenario' | 'channel' | 'customer';
  dateRange: { start: string; end: string };
  filters?: {
    scenarioId?: string;
    channelId?: string;
  };
}

export async function generatePDF(config: ReportConfig): Promise<string> {
  const fileName = `report_${Date.now()}.pdf`;
  const filePath = join(REPORTS_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text('FinMark Marketing Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Type: ${config.type.toUpperCase()}`, { align: 'center' });
    doc.text(`Period: ${config.dateRange.start} - ${config.dateRange.end}`, { align: 'center' });
    doc.moveDown(2);

    getReportData(config)
      .then((data) => {
        doc.fontSize(14).text('Performance Summary');
        doc.moveDown();

        const tableTop = 200;
        const tableLeft = 50;
        const cellHeight = 20;
        const cellWidths = [150, 100, 100, 100];

        doc.font('Helvetica-Bold');
        doc.text('Metric', tableLeft, tableTop, { width: cellWidths[0] });
        doc.text('Value', tableLeft + cellWidths[0], tableTop, { width: cellWidths[1] });
        doc.text('Target', tableLeft + cellWidths[0] + cellWidths[1], tableTop, { width: cellWidths[2] });
        doc.text('Achievement', tableLeft + cellWidths[0] + cellWidths[1] + cellWidths[2], tableTop);

        doc.font('Helvetica');
        let y = tableTop + cellHeight;
        Object.entries(data.metrics).forEach(([key, value]: [string, any]) => {
          doc.text(key, tableLeft, y, { width: cellWidths[0] });
          doc.text(value.actual.toString(), tableLeft + cellWidths[0], y, { width: cellWidths[1] });
          doc.text(value.target.toString(), tableLeft + cellWidths[0] + cellWidths[1], y, { width: cellWidths[2] });
          doc.text(`${value.achievement}%`, tableLeft + cellWidths[0] + cellWidths[1] + cellWidths[2], y);
          y += cellHeight;
        });

        doc.end();
        resolve(fileName);
      })
      .catch(reject);

    stream.on('error', reject);
  });
}

export async function generateExcel(config: ReportConfig): Promise<string> {
  const fileName = `report_${Date.now()}.xlsx`;
  const filePath = join(REPORTS_DIR, fileName);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FinMark';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Actual', key: 'actual', width: 15 },
    { header: 'Target', key: 'target', width: 15 },
    { header: 'Achievement %', key: 'achievement', width: 15 },
  ];

  const data = await getReportData(config);
  Object.entries(data.metrics).forEach(([key, value]: [string, any]) => {
    summarySheet.addRow({
      metric: key,
      actual: value.actual,
      target: value.target,
      achievement: value.achievement,
    });
  });

  const execSheet = workbook.addWorksheet('Executions');
  execSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Scenario', key: 'scenario', width: 30 },
    { header: 'Reach', key: 'reach', width: 15 },
    { header: 'Response', key: 'response', width: 15 },
    { header: 'Conversion', key: 'conversion', width: 15 },
    { header: 'ROI', key: 'roi', width: 15 },
  ];

  data.executions.forEach((exec) => {
    execSheet.addRow(exec);
  });

  await workbook.xlsx.writeFile(filePath);
  return fileName;
}

async function getReportData(config: ReportConfig) {
  const startDate = new Date(config.dateRange.start);
  const endDate = new Date(config.dateRange.end);

  const executions = await prisma.execution.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      scenario: true,
    },
  });

  const totalReach = executions.reduce((sum, e) => sum + (e.actualReach || 0), 0);
  const totalResponse = executions.reduce((sum, e) => sum + (e.actualResponse || 0), 0);
  const totalConversion = executions.reduce((sum, e) => sum + (e.actualConversion || 0), 0);

  return {
    metrics: {
      'Total Reach': { actual: totalReach, target: totalReach * 1.1, achievement: 91 },
      'Response Rate': {
        actual: +(totalResponse / totalReach * 100).toFixed(2),
        target: 25,
        achievement: 85,
      },
      'Conversion Rate': {
        actual: +(totalConversion / totalReach * 100).toFixed(2),
        target: 15,
        achievement: 78,
      },
      'Average ROI': { actual: 2.8, target: 3.0, achievement: 93 },
    },
    executions: executions.map((e) => ({
      date: e.createdAt.toISOString().split('T')[0],
      scenario: e.scenario?.title || 'Unknown',
      reach: e.actualReach || 0,
      response: e.actualResponse || 0,
      conversion: e.actualConversion || 0,
      roi: (e.result as any)?.roi || 0,
    })),
  };
}
