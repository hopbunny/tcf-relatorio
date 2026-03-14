import { Technician } from './types';

const PRIMARY_COLOR: [number, number, number] = [37, 99, 235]; // Blue-600
const ACCENT_COLOR: [number, number, number] = [6, 182, 212]; // Cyan-500
const DARK_COLOR: [number, number, number] = [15, 23, 42]; // Slate-900
const GRAY_COLOR: [number, number, number] = [100, 116, 139]; // Slate-500
const LIGHT_GRAY: [number, number, number] = [241, 245, 249]; // Slate-100
const WHITE: [number, number, number] = [255, 255, 255];
const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // Slate-200

function checkPage(doc: any, y: number, needed: number, pageHeight: number): number {
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

export async function generatePDF(technician: Technician) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ============================================
  // HEADER - Gradient bar
  // ============================================
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent stripe
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 26, pageWidth, 2, 'F');

  // Company name
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TCF TELECOM', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Departamento Técnico / Operacional', margin, 18);

  // Report title on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RELATÓRIO DIÁRIO TÉCNICO', pageWidth - margin, 12, { align: 'right' });

  y = 36;

  // ============================================
  // INFO BOX
  // ============================================
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'S');

  const col1 = margin + 5;
  const col2 = margin + contentWidth / 2;

  doc.setTextColor(...GRAY_COLOR);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('TÉCNICO', col1, y + 6);
  doc.text('RESPONSÁVEL', col2, y + 6);

  doc.setTextColor(...DARK_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(technician.technicianName, col1, y + 13);
  doc.text(technician.responsibleName, col2, y + 13);

  doc.setTextColor(...GRAY_COLOR);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('DATA', col1, y + 19);
  doc.setTextColor(...DARK_COLOR);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const dateStr = (() => {
    try {
      return new Date(technician.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch {
      return technician.date;
    }
  })();
  doc.text(dateStr, col1 + 10, y + 19);

  y += 28;

  // ============================================
  // SERVICES
  // ============================================
  if (technician.services.length === 0) {
    doc.setTextColor(...GRAY_COLOR);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Nenhum serviço registrado para este técnico.', pageWidth / 2, y + 10, { align: 'center' });
  } else {
    technician.services.forEach((service, index) => {
      y = checkPage(doc, y, 50, pageHeight);

      // Service number badge
      doc.setFillColor(...PRIMARY_COLOR);
      doc.circle(margin + 4, y + 4, 4, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(String(index + 1), margin + 4, y + 5.5, { align: 'center' });

      // Service type badge
      const badgeX = margin + 12;
      const serviceTypeText = service.serviceType.toUpperCase();
      doc.setFillColor(...ACCENT_COLOR);
      doc.roundedRect(badgeX, y, 40, 8, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(serviceTypeText.substring(0, 20), badgeX + 20, y + 5.5, { align: 'center' });

      y += 12;

      // Client info row
      doc.setFillColor(...LIGHT_GRAY);
      const clientRowH = service.startTime ? 20 : 14;
      doc.rect(margin, y, contentWidth, clientRowH, 'F');
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, contentWidth, clientRowH, 'S');

      doc.setTextColor(...GRAY_COLOR);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('CÓDIGO', margin + 4, y + 4.5);
      doc.text('CLIENTE', margin + 35, y + 4.5);

      doc.setTextColor(...DARK_COLOR);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(service.clientCode, margin + 4, y + 11);
      doc.text(service.clientName, margin + 35, y + 11);

      // Horário e status
      if (service.startTime) {
        const timeStr = service.startTime + (service.endTime ? ` – ${service.endTime}` : '');
        const statusLabel = service.status === 'pending' ? 'Pendente' : service.status === 'in_progress' ? 'Em Andamento' : 'Concluído';
        doc.setTextColor(...GRAY_COLOR);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('HORÁRIO', margin + 4, y + 15.5);
        doc.text('STATUS', margin + 50, y + 15.5);
        doc.setTextColor(...DARK_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(timeStr, margin + 4, y + 19);
        doc.text(statusLabel, margin + 50, y + 19);
      }

      y += clientRowH + 4;

      // Description
      if (service.description && service.description.trim()) {
        y = checkPage(doc, y, 20, pageHeight);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('DESCRIÇÃO DA OCORRÊNCIA', margin, y);
        y += 4;

        doc.setTextColor(...DARK_COLOR);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(service.description, contentWidth);
        y = checkPage(doc, y, descLines.length * 4.5 + 4, pageHeight);
        doc.text(descLines, margin, y);
        y += descLines.length * 4.5 + 4;
      }

      // Procedures
      if (service.procedures.length > 0) {
        y = checkPage(doc, y, 16, pageHeight);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('PROCEDIMENTOS REALIZADOS', margin, y);
        y += 5;

        service.procedures.forEach((proc, pIdx) => {
          if (!proc.trim()) return;
          y = checkPage(doc, y, 10, pageHeight);
          const procLines = doc.splitTextToSize(proc, contentWidth - 8);
          doc.setFillColor(...ACCENT_COLOR);
          doc.circle(margin + 2, y + 1.5, 1.2, 'F');
          doc.setTextColor(...DARK_COLOR);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(procLines, margin + 6, y + 2);
          y += procLines.length * 4.5 + 1;
        });
        y += 2;
      }

      // Analysis
      if (service.analysis && service.analysis.trim()) {
        y = checkPage(doc, y, 16, pageHeight);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('ANÁLISE TÉCNICA', margin, y);
        y += 4;

        doc.setTextColor(...DARK_COLOR);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const analysisLines = doc.splitTextToSize(service.analysis, contentWidth);
        y = checkPage(doc, y, analysisLines.length * 4.5 + 4, pageHeight);
        doc.text(analysisLines, margin, y);
        y += analysisLines.length * 4.5 + 4;
      }

      // Observations
      const validObs = service.observations.filter(o => o && o.trim());
      if (validObs.length > 0) {
        y = checkPage(doc, y, 16, pageHeight);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('OBSERVAÇÕES', margin, y);
        y += 5;

        validObs.forEach((obs) => {
          y = checkPage(doc, y, 10, pageHeight);
          const obsLines = doc.splitTextToSize(obs, contentWidth - 8);
          doc.setFillColor(245, 158, 11); // Amber
          doc.circle(margin + 2, y + 1.5, 1.2, 'F');
          doc.setTextColor(...DARK_COLOR);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(obsLines, margin + 6, y + 2);
          y += obsLines.length * 4.5 + 1;
        });
        y += 2;
      }

      // Divider between services
      if (index < technician.services.length - 1) {
        y += 4;
        y = checkPage(doc, y, 10, pageHeight);
        doc.setDrawColor(...BORDER_COLOR);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      }
    });
  }

  // ============================================
  // SUMMARY BOX - Tempo total e contagem
  // ============================================
  if (technician.services.length > 0) {
    y = checkPage(doc, y, 30, pageHeight);
    y += 6;

    // Calcular totais
    const totalMin = technician.services.reduce((acc, s) => {
      if (!s.startTime || !s.endTime) return acc;
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return diff > 0 ? acc + diff : acc;
    }, 0);
    const doneCount = technician.services.filter(s => !s.status || s.status === 'done').length;
    const pendingCount = technician.services.filter(s => s.status === 'pending' || s.status === 'in_progress').length;

    doc.setFillColor(...PRIMARY_COLOR);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('RESUMO DO DIA', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const col1x = margin + 4;
    const col2x = margin + contentWidth / 3;
    const col3x = margin + (contentWidth / 3) * 2;

    doc.text(`Total de Atendimentos: ${technician.services.length}`, col1x, y + 12);
    doc.text(`Concluídos: ${doneCount}  |  Pendentes: ${pendingCount}`, col2x, y + 12);
    if (totalMin > 0) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const timeStr = h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
      doc.text(`Tempo Total: ${timeStr}`, col3x, y + 12);
    }

    y += 24;
  }

  // ============================================
  // FOOTER on each page
  // ============================================
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...LIGHT_GRAY);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);

    doc.setTextColor(...GRAY_COLOR);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('TCF Telecom — Relatório Gerado Automaticamente', margin, pageHeight - 5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  }

  // Save
  const safeName = technician.technicianName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
  const filename = `TCF-Relatorio-${safeName}-${technician.date}.pdf`;
  doc.save(filename);
}
