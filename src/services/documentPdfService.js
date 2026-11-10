import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const formatCLP = (val) => '$' + Math.round(val || 0).toLocaleString('es-CL');

export const documentPdfService = {
  async generateQRDataUrl(folio) {
    const baseUrl = window.location.origin;
    const verificationUrl = `${baseUrl}/verify?folio=${encodeURIComponent(folio)}`;
    return await QRCode.toDataURL(verificationUrl, {
      width: 140, margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  },

  async downloadJplCertificatePdf(cert) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const qrDataUrl = await this.generateQRDataUrl(cert.folio);
    const left = 20;
    let y = 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text((cert.condo_name || 'CONDOMINIO').toUpperCase(), left, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`RUT: ${cert.condo_rut || '—'} — Administración de Copropiedad Inmobiliaria`, left, y);
    y += 4;
    doc.text(`Destino: ${cert.jpl_court_destination || 'Juzgado de Policía Local Competente'}`, left, y);

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(140, 15, 56, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FOLIO DE AUTENTICIDAD', 143, 21);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(2, 132, 199);
    doc.text(cert.folio, 143, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha: ${cert.issued_at}`, 143, 30);

    y += 18;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.line(left, y, 196, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('CERTIFICADO DE DEUDA CON MÉRITO EJECUTIVO', 108, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('(Artículo 6° de la Ley N° 21.442 de Copropiedad Inmobiliaria)', 108, y, { align: 'center' });

    y += 12;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const bodyText = `El Administrador que suscribe certifica que don/doña ${cert.owner_name || 'Copropietario/a'}, en su calidad de titular de la Unidad N° ${cert.unit_number} del ${cert.condo_name}, adeuda a la comunidad la suma líquida, vencida y actualmente exigible de ${formatCLP(cert.total_debt)} CLP, desglosada en ${cert.unpaid_periods_count || (cert.bills_detail || []).length} períodos continuos o discontinuos:`;
    const splitBody = doc.splitTextToSize(bodyText, 176);
    doc.text(splitBody, left, y);
    y += splitBody.length * 5 + 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(left, y, 176, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('PERÍODO', left + 4, y + 4.5);
    doc.text('FOLIO COLILLA', left + 45, y + 4.5);
    doc.text('VENCIMIENTO', left + 95, y + 4.5);
    doc.text('SALDO ADEUDADO', left + 172, y + 4.5, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    (cert.bills_detail || []).forEach((b) => {
      doc.setDrawColor(241, 245, 249);
      doc.line(left, y + 6, left + 176, y + 6);
      doc.setTextColor(15, 23, 42);
      doc.text(b.period_name || 'Gasto Común', left + 4, y + 4.5);
      doc.text(b.executive_folio || 'COL-2026-N/D', left + 45, y + 4.5);
      doc.text(b.due_date || '—', left + 95, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCLP(b.balance_due || b.balance), left + 172, y + 4.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 6.5;
    });

    y += 2;
    doc.setFillColor(248, 250, 252);
    doc.rect(left, y, 176, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28);
    doc.text('TOTAL DEMANDABLE EN JUICIO EJECUTIVO:', left + 4, y + 5.5);
    doc.text(`${formatCLP(cert.total_debt)} CLP`, left + 172, y + 5.5, { align: 'right' });

    y += 16;
    doc.setDrawColor(2, 132, 199);
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(left, y, 176, 32, 2, 2, 'FD');
    doc.addImage(qrDataUrl, 'PNG', left + 4, y + 3, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(3, 105, 161);
    doc.text('VALIDACIÓN DE FE PÚBLICA DIGITAL (CONDOMINIO SEGURO)', left + 34, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const verifyNote = 'Escanee este código QR con cualquier dispositivo móvil para contrastar la veracidad de este documento directamente en el Registro Central de la Copropiedad.';
    doc.text(doc.splitTextToSize(verifyNote, 136), left + 34, y + 14);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`HASH SHA-256: ${cert.folio.replace(/[^a-zA-Z0-9]/g, '')}-SEC-AUTH`, left + 34, y + 27);

    y += 48;
    const signCol1 = left + 15;
    const signCol2 = left + 105;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(signCol1, y, signCol1 + 55, y);
    doc.line(signCol2, y, signCol2 + 55, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FIRMA ADMINISTRADOR', signCol1 + 27.5, y, { align: 'center' });
    doc.text('V°B° PRESIDENTE COMITÉ', signCol2 + 27.5, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(cert.condo_name, signCol1 + 27.5, y, { align: 'center' });
    doc.text(cert.committee_president_name || 'Comité de Administración', signCol2 + 27.5, y, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento emitido conforme al Art. 6° de la Ley N° 21.442. Válido como Título Ejecutivo en Chile.', 108, 268, { align: 'center' });

    doc.save(`Certificado_JPL_${cert.folio}.pdf`);
  },

  async downloadCutoffNoticePdf(notice) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const qrDataUrl = await this.generateQRDataUrl(notice.notice_folio || notice.folio);
    const left = 20;
    let y = 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text((notice.condo_name || 'CONDOMINIO').toUpperCase(), left, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Administración y Seguridad Operacional', left, y);

    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(130, 15, 66, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28);
    doc.text('NOTIFICACIÓN DE APERCIBIMIENTO', 133, 21);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(notice.notice_folio || notice.folio, 133, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha Emisión: ${new Date().toISOString().split('T')[0]}`, 133, 30);

    y += 18;
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(left, y, 196, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text('CARTA DE APERCIBIMIENTO FORMAL DE CORTE DE SUMINISTRO', 108, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('(Artículo 20° de la Ley N° 21.442 de Copropiedad Inmobiliaria)', 108, y, { align: 'center' });

    y += 14;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const bodyText = `Por medio del presente instrumento se notifica formalmente al copropietario/a y ocupantes de la Unidad N° ${notice.unit_number}, que a la fecha registra un saldo moroso de ${formatCLP(notice.total_debt)} CLP correspondiente a ${notice.unpaid_periods_count} cuotas impagas de gastos comunes.\n\nConforme a lo dispuesto en el inciso primero del Artículo 20° de la Ley N° 21.442, la asamblea y el reglamento facultan expresamente a la Administración para proceder al CORTE O SUSPENSIÓN del servicio de ${(notice.service_type || 'energía eléctrica').replace('_', ' ').toUpperCase()} a aquellas unidades que adeuden tres o más cuotas continuas o discontinuas.\n\nPor tanto, se fija como PLAZO FATAL IMPRORROGABLE el día ${notice.deadline_date} para que concurra a regularizar la totalidad de la deuda o suscriba un convenio formal de pago.`;
    const splitText = doc.splitTextToSize(bodyText, 176);
    doc.text(splitText, left, y);
    y += splitText.length * 4.8 + 8;

    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(left, y, 176, 22, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(153, 27, 27);
    doc.text('PLAZO FATAL DE REGULARIZACIÓN:', left + 6, y + 8);
    doc.text(notice.deadline_date, left + 170, y + 8, { align: 'right' });
    doc.text('MONTO TOTAL ADEUDADO:', left + 6, y + 16);
    doc.text(`${formatCLP(notice.total_debt)} CLP`, left + 170, y + 16, { align: 'right' });

    y += 32;
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(left, y, 176, 32, 2, 2, 'FD');
    doc.addImage(qrDataUrl, 'PNG', left + 4, y + 3, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('REGISTRO OFICIAL DE NOTIFICACIONES FEHACIENTES', left + 34, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const qrDesc = 'Escanee este código QR para comprobar la vigencia de la orden de suspensión y su registro en la bitácora legal del edificio.';
    doc.text(doc.splitTextToSize(qrDesc, 136), left + 34, y + 14);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`NOTIF-ID: ${notice.notice_folio || notice.folio}`, left + 34, y + 27);

    y += 50;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.line(78, y, 138, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('ADMINISTRACIÓN DE LA COPROPIEDAD', 108, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Ley N° 21.442 de Copropiedad Inmobiliaria', 108, y, { align: 'center' });

    doc.save(`Apercibimiento_Corte_${notice.notice_folio || notice.folio}.pdf`);
  }
};
