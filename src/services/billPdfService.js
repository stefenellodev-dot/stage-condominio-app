import { supabase } from '../lib/supabase';
import { storageService } from './storageService';

export const billPdfService = {
  /**
   * Genera el PDF a partir del DOM renderizado y lo sube al bucket 'colillas'
   */
  async generateAndUploadBillPdf({ billData, elementRef }) {
    if (!elementRef || !billData) throw new Error('Referencia de elemento o datos de colilla inválidos.');

    const condoId = billData.units?.condominiums?.id;
    const periodId = billData.period_id;
    const unitNumber = billData.units?.unit_number;

    if (!condoId || !periodId || !unitNumber) {
      throw new Error('Faltan metadatos esenciales para construir la ruta del archivo.');
    }

    // Importación dinámica para optimizar el bundle principal
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${unitNumber}_colilla.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 1. Generar blob del PDF en memoria
    const pdfBlob = await html2pdf().set(opt).from(elementRef).output('blob');

    // 2. Ruta estandarizada: {condo_id}/{period_id}/{unit_number}_colilla.pdf
    const storagePath = `${condoId}/${periodId}/${unitNumber}_colilla.pdf`;

    // 3. Subida directa a Supabase Storage
    const { data, error } = await supabase.storage
      .from('colillas')
      .upload(storagePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) throw error;
    return data.path;
  },

  /**
   * Obtiene la URL firmada para que el residente descargue su PDF oficial
   */
  async getBillDownloadUrl(condoId, periodId, unitNumber) {
    const storagePath = `${condoId}/${periodId}/${unitNumber}_colilla.pdf`;
    return await storageService.getSignedDownloadUrl('colillas', storagePath, 7200);
  }
};