/**
 * PDF Reporting Engine for Activity Logs, Sales Audits, and GDPR Records
 * Utilizes jsPDF for client-side, offline-compatible PDF document generation.
 */

import { jsPDF } from 'jspdf';
import { SystemAuditLog, Transaction, Product, GDPRConsent } from '../types';

export function exportAuditLogsPDF(logs: any[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BLUENILLA ENTERPRISE OPERATIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('AUDIT TRAIL & SYSTEM ACTIVITY LOG REPORT', 14, 18);

  const printTime = new Date().toLocaleString();
  doc.text(`Generated: ${printTime}`, pageWidth - 14, 18, { align: 'right' });

  // Metadata block
  y = 34;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Scope Overview:', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Records: ${logs.length} entries | Compliance: GDPR ISO/IEC 27001 Certified Vault`, 14, y + 5);
  doc.text(`Security Level: Restricted Internal Operations`, 14, y + 10);

  y += 18;

  // Table Headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  doc.text('TIMESTAMP', 16, y + 5.5);
  doc.text('OPERATOR', 48, y + 5.5);
  doc.text('MODULE', 82, y + 5.5);
  doc.text('ACTION & EVENT DETAILS', 110, y + 5.5);
  doc.text('SEVERITY', pageWidth - 16, y + 5.5, { align: 'right' });

  y += 9;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  logs.forEach((log, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
      // Header for next page
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('TIMESTAMP', 16, y + 5);
      doc.text('OPERATOR', 48, y + 5);
      doc.text('MODULE', 82, y + 5);
      doc.text('ACTION & EVENT DETAILS', 110, y + 5);
      doc.text('SEVERITY', pageWidth - 16, y + 5, { align: 'right' });
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    // Zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 7.5, 'F');
    }

    const timestampStr = typeof log.timestamp === 'string' 
      ? (log.timestamp.length >= 16 ? log.timestamp.substring(5, 16) : log.timestamp)
      : (log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A');
    const userStr = String(log.userName || log.actorName || 'System');
    const workspaceStr = String(log.workspace || log.actorRole || 'IT').toUpperCase();
    const actionStr = String(log.action || '');
    const detailsStr = String(log.details || log.entity || '');
    const severityStr = String(log.severity || 'info').toLowerCase();

    doc.setTextColor(71, 85, 105);
    doc.text(timestampStr, 16, y + 4);
    
    doc.setTextColor(15, 23, 42);
    doc.text(userStr.length > 18 ? userStr.substring(0, 18) + '...' : userStr, 48, y + 4);

    doc.setTextColor(99, 102, 241);
    doc.text(workspaceStr, 82, y + 4);

    doc.setTextColor(30, 41, 59);
    const detailSnippet = `${actionStr}: ${detailsStr}`;
    const truncated = detailSnippet.length > 52 ? detailSnippet.substring(0, 52) + '...' : detailSnippet;
    doc.text(truncated, 110, y + 4);

    if (severityStr === 'critical') {
      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
    } else if (severityStr === 'warning') {
      doc.setTextColor(217, 119, 6);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(severityStr.toUpperCase(), pageWidth - 16, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7.5;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${totalPages} — Confidential System Audit Log — BLUENILLA Cloud POS`, pageWidth / 2, 290, { align: 'center' });
  }

  doc.save(`BLUENILLA_AuditLogs_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportSalesReportPDF(transactions: Transaction[], dateLabel = 'Today') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(30, 27, 75); // indigo-950
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BLUENILLA POS — SALES & Z-REPORT', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(`Reporting Period: ${dateLabel} | Generated: ${new Date().toLocaleString()}`, 14, 20);

  // Summary Metrics Cards
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.total : 0), 0);
  const totalTax = transactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.taxTotal : 0), 0);
  const completedCount = transactions.filter(t => t.status === 'completed').length;
  const avgTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

  y = 36;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 42, 20, 2, 2, 'F');
  doc.roundedRect(60, y, 42, 20, 2, 2, 'F');
  doc.roundedRect(106, y, 42, 20, 2, 2, 'F');
  doc.roundedRect(152, y, 44, 20, 2, 2, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('GROSS REVENUE', 18, y + 6);
  doc.text('COMPLETED SALES', 64, y + 6);
  doc.text('AVERAGE TICKET', 110, y + 6);
  doc.text('TAX COLLECTED', 156, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`$${totalRevenue.toFixed(2)}`, 18, y + 14);
  doc.text(`${completedCount} orders`, 64, y + 14);
  doc.text(`$${avgTicket.toFixed(2)}`, 110, y + 14);
  doc.text(`$${totalTax.toFixed(2)}`, 156, y + 14);

  y += 28;

  // Transactions list
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Transaction Breakdown', 14, y);

  y += 6;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('RECEIPT #', 16, y + 5);
  doc.text('TIME', 50, y + 5);
  doc.text('CASHIER', 80, y + 5);
  doc.text('ITEMS', 120, y + 5);
  doc.text('STATUS', 145, y + 5);
  doc.text('AMOUNT', pageWidth - 16, y + 5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  transactions.forEach((tx, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 7, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(tx.receiptNumber, 16, y + 4);
    doc.setTextColor(100, 116, 139);
    doc.text(tx.timestamp.substring(11, 16) || 'N/A', 50, y + 4);
    doc.setTextColor(15, 23, 42);
    doc.text(tx.cashierName, 80, y + 4);
    doc.text(`${tx.items.length} items`, 120, y + 4);

    if (tx.status === 'completed') {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(tx.status.toUpperCase(), 145, y + 4);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${tx.total.toFixed(2)}`, pageWidth - 16, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  doc.save(`BLUENILLA_SalesZReport_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportInventoryValuationPDF(products: Product[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('BLUENILLA STOREROOM — INVENTORY VALUATION', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Snapshot Date: ${new Date().toLocaleString()}`, 14, 19);

  y = 32;
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalCostVal = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalRetailVal = products.reduce((acc, p) => acc + p.stock * p.price, 0);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total SKU Lines: ${products.length} | On-Hand Units: ${totalUnits} | Cost Asset: $${totalCostVal.toFixed(2)} | Retail Potential: $${totalRetailVal.toFixed(2)}`, 14, y);

  y += 8;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(7.5);
  doc.text('SKU / BARCODE', 16, y + 5);
  doc.text('PRODUCT NAME', 55, y + 5);
  doc.text('BIN LOCATION', 105, y + 5);
  doc.text('STOCK', 140, y + 5);
  doc.text('UNIT COST', 160, y + 5);
  doc.text('TOTAL COST', pageWidth - 16, y + 5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  products.forEach((p, idx) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 1, pageWidth - 28, 6.5, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.text(p.sku, 16, y + 4);
    doc.text(p.name.length > 28 ? p.name.substring(0, 28) + '...' : p.name, 55, y + 4);
    doc.setTextColor(100, 116, 139);
    doc.text(p.binLocation.substring(0, 18), 105, y + 4);

    doc.setTextColor(p.stock <= p.reorderPoint ? 220 : 15, p.stock <= p.reorderPoint ? 38 : 23, p.stock <= p.reorderPoint ? 38 : 42);
    doc.text(`${p.stock} units`, 140, y + 4);

    doc.setTextColor(71, 85, 105);
    doc.text(`$${p.costPrice.toFixed(2)}`, 160, y + 4);

    doc.setTextColor(15, 23, 42);
    doc.text(`$${(p.stock * p.costPrice).toFixed(2)}`, pageWidth - 16, y + 4, { align: 'right' });

    y += 6.5;
  });

  doc.save(`BLUENILLA_InventoryValuation_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportAuditLogsCSV(logs: any[]) {
  const headers = ['ID', 'Timestamp', 'User ID', 'User Name', 'Workspace', 'Action', 'Severity', 'IP Address', 'Device Type', 'Details'];
  const rows = logs.map(l => [
    l.id || '',
    `"${l.timestamp || ''}"`,
    `"${l.userId || l.actorId || ''}"`,
    `"${l.userName || l.actorName || ''}"`,
    `"${l.workspace || l.actorRole || ''}"`,
    `"${l.action || ''}"`,
    `"${l.severity || 'info'}"`,
    `"${l.ipAddress || ''}"`,
    `"${l.deviceType || ''}"`,
    `"${String(l.details || l.entity || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `BLUENILLA_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
