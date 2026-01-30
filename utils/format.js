exports.formatDateHeader = (param) => {
  if (!param) return null;

  // Se o XLSX entregar Date (excel)
  if (param instanceof Date) {
    const y = param.getFullYear();
    const m = String(param.getMonth() + 1).padStart(2, '0');
    const d = String(param.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // String dd/MM/yyyy
  const [day, month, year] = param.trim().split('/');

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

exports.toPositiveBRL = (value) => {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') {
    return Math.round(Math.abs(value) * 100) / 100;
  }

  if (typeof value !== 'string') return 0;

  const cleaned = value.replace(/[^0-9,.-]+/g, '');
  const normalized = cleaned.replace(/\./g, '').replace(',', '.');

  const numericValue = parseFloat(normalized);
  if (isNaN(numericValue)) return 0;

  return Math.round(Math.abs(numericValue) * 100) / 100;
};

exports.parseTransaction = (input) => {
  const parts = input.split(/\s{2,}/);
  const expType = parts[0].trim();
  const rest = parts[1]?.trim() || '';
  const dateMatch = rest.match(/(\d{2})\/(\d{2})/);

  let dateISO = null;
  if (dateMatch) {
    const [, day, month] = dateMatch;
    const year = new Date().getFullYear();
    dateISO = new Date(`${year}-${month}-${day}`).toISOString();
  }

  return {
    expType,
    date: dateISO,
    exp: rest.replace(dateMatch?.[0] || '', '').trim(),
  };
};

exports.AcceptThisPattern = (val) =>
  typeof val === 'string' && /^[0-9]{6}$/.test(val.trim());
