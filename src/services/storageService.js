import { supabase } from '../lib/supabase';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Servicio centralizado para Supabase Storage bajo la Ley N° 21.442
 * Buckets: colillas, comprobantes-pago, certificaciones, evidencias-infracciones, actas-asambleas
 */
export const storageService = {
  _validateCondoId(condominiumId) {
    if (!UUID_REGEX.test(condominiumId)) {
      throw new Error('ID de condominio inválido.');
    }
  },

  _validateFileSize(file, maxSizeMB) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      throw new Error(`El archivo no debe superar los ${maxSizeMB} MB.`);
    }
  },

  _validateMimeType(file, allowedTypes) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`);
    }
  },

  /**
   * Sube un comprobante de pago de gastos comunes.
   * Path: {condominium_id}/{period_id}/{unit_id}_{timestamp}.{ext}
   */
  async uploadPaymentVoucher({ condominiumId, periodId, unitId, file }) {
    this._validateCondoId(condominiumId);
    this._validateFileSize(file, 5);
    this._validateMimeType(file, ['image/jpeg', 'image/png', 'application/pdf']);

    const fileExt = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
    if (!allowedExts.includes(fileExt)) {
      throw new Error('Formato no permitido. Utilice JPG, PNG o PDF.');
    }

    const fileName = `${unitId}_${Date.now()}.${fileExt}`;
    const filePath = `${condominiumId}/${periodId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('comprobantes-pago')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  },

  /**
   * Sube evidencia fotográfica o documental de una infracción.
   * Path: {condominium_id}/{infraction_id}/{origin}_{timestamp}.{ext}
   */
  async uploadInfractionEvidence({ condominiumId, infractionId, origin = 'conserjeria', file }) {
    this._validateCondoId(condominiumId);
    this._validateFileSize(file, 25);
    this._validateMimeType(file, ['image/jpeg', 'image/png', 'application/pdf', 'audio/mpeg']);

    const fileExt = file.name.split('.').pop().toLowerCase();
    const filePath = `${condominiumId}/${infractionId}/${origin}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('evidencias-infracciones')
      .upload(filePath, file);

    if (error) throw error;
    return data.path;
  },

  /**
   * Sube un certificado oficial técnico (MINVU / SEC).
   * Path: {condominium_id}/{asset_id}/{cert_type}_{folio}.pdf
   */
  async uploadTechnicalCertification({ condominiumId, assetId, certType, folio, file }) {
    this._validateCondoId(condominiumId);
    this._validateFileSize(file, 15);
    this._validateMimeType(file, ['application/pdf', 'image/jpeg', 'image/png']);

    const filePath = `${condominiumId}/${assetId}/${certType}_${folio}.pdf`;

    const { data, error } = await supabase.storage
      .from('certificaciones')
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;
    return data.path;
  },

  /**
   * Sube un acta de asamblea.
   * Path: {condominium_id}/{assembly_id}/acta_reducida.pdf
   */
  async uploadAssemblyMinutes({ condominiumId, assemblyId, file }) {
    this._validateCondoId(condominiumId);
    this._validateFileSize(file, 20);
    this._validateMimeType(file, ['application/pdf']);

    const filePath = `${condominiumId}/${assemblyId}/acta_reducida.pdf`;

    const { data, error } = await supabase.storage
      .from('actas-asambleas')
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;
    return data.path;
  },

  /**
   * Sube una colilla de gasto común.
   * Path: {condominium_id}/{period_id}/{unit_number}_colilla.pdf
   */
  async uploadBillColilla({ condominiumId, periodId, unitNumber, file }) {
    this._validateCondoId(condominiumId);
    this._validateFileSize(file, 10);
    this._validateMimeType(file, ['application/pdf']);

    const filePath = `${condominiumId}/${periodId}/${unitNumber}_colilla.pdf`;

    const { data, error } = await supabase.storage
      .from('colillas')
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) throw error;
    return data.path;
  },

  /**
   * Obtiene una URL firmada temporal para visualizar o descargar documentos privados.
   * @param {string} bucketName - 'colillas', 'comprobantes-pago', etc.
   * @param {string} path - Ruta del archivo en el bucket.
   * @param {number} expiresIn - Segundos de validez (por defecto 1 hora).
   */
  async getSignedDownloadUrl(bucketName, path, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Obtiene la URL pública directa para recursos de libre lectura comunitaria (Certificaciones).
   */
  getPublicUrl(bucketName, path) {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * Elimina un archivo del storage.
   * @param {string} bucketName - Nombre del bucket.
   * @param {string} path - Ruta del archivo.
   */
  async deleteFile(bucketName, path) {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) throw error;
    return true;
  },
};