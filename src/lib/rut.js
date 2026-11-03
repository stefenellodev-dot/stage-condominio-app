export function cleanRut(rut) {
  return typeof rut === 'string' ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : '';
}

export function validateRut(rut) {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedVal = 11 - (sum % 11);
  let expectedDv = '0';
  if (expectedVal === 11) expectedDv = '0';
  else if (expectedVal === 10) expectedDv = 'K';
  else expectedDv = expectedVal.toString();

  return dv === expectedDv;
}

export function formatRut(rut) {
  const cleaned = cleanRut(rut);
  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${dv}`;
}
