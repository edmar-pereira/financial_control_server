const XLSX = require('xlsx');
const CategoryInfo = require('../../models/category.info.model');
const { formatDateHeader } = require('../../utils/format');
const {
  checkForDuplicateTransactions,
} = require('../../utils/checkForDuplicateTransactions');

const normalizeText = (text = '') =>
  String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const toISODate = (date) => date.split('/').reverse().join('-');

// "-R$ 1.234,56" -> -1234.56
const parseAmount = (raw) => {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (raw == null) return null;

  const clean = String(raw)
    .replace(/R\$|\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
};

// A ordem importa: a primeira regra que bater vence.
const PAYMENT_RULES = [
  ['DEBITO', 'DEBITO'],
  ['PIX ENVIADO', 'PIX ENVIADO'],
  ['PIX AGENDADO', 'PIX ENVIADO'],
  ['PIX RECEBIDO', 'PIX RECEBIDO'],
  ['SAQUE', 'SAQUE'],
  ['BOLETO', 'BOLETO'],
  ['LIQUIDO DE VENCIMENTO', 'RECEITA'],
  ['CNPJ 033372251000156', 'RECEITA'],
  ['JUROS', 'JUROS'],
  ['IOF', 'JUROS'],
  ['REMUNERACAO', 'REMUNERACAO AUTOMATICA'], // antes de APLICACAO
  ['APLICACAO', 'INVESTIMENTO'],
  ['INVESTIMENTO', 'INVESTIMENTO'],
];

const SPECIAL_RULES = [
  {
    match: 'IOF ADICIONAL - AUTOMATICO',
    fantasyName: 'IOF ADICIONAL',
    companyName: 'IOF ADICIONAL',
    categoryId: 'taxes_fees',
  },
    {
    match: 'IOF IMPOSTO OPERACOES FINANCEIRAS',
    fantasyName: 'IOF',
    companyName: 'IOF',
    categoryId: 'taxes_fees',
  },
      {
    match: 'JUROS SALDO UTILIZ ATE LIMITE',
    fantasyName: 'Cheque Especial',
    companyName: 'Cheque Especial',
    categoryId: 'taxes_fees',
  },
  {
    match: 'SAQUE DINHEIRO',
    fantasyName: 'SAQUE DINHEIRO BANCO 24H',
    companyName: 'SAQUE DINHEIRO BANCO 24H',
    categoryId: 'cash_withdrawal', // ajuste para o id que você usa
  },
];

const findSpecialRule = (type) =>
  SPECIAL_RULES.find((rule) => type.includes(normalizeText(rule.match)));

const getPaymentType = (type) =>
  PAYMENT_RULES.find(([term]) => type.includes(term))?.[1] || 'OUTROS';

// "Debito visa electron brasil\n18/10 big bom supermercad"
// -> { type, purchaseDate: "18/10", name }
const splitDescription = (raw) => {
  const [first = '', ...rest] = String(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const detail = rest.join(' ');
  const match = detail.match(/^(\d{2}\/\d{2})\s+(.+)$/);

  return {
    type: normalizeText(first),
    purchaseDate: match ? match[1] : '',
    name: normalizeText(match ? match[2] : detail),
  };
};

const resolvePurchaseDate = (statementDate, purchaseDate) => {
  if (!purchaseDate) return statementDate;

  const [sDay, sMonth, sYear] = statementDate.split('/').map(Number);
  const [pDay, pMonth] = purchaseDate.split('/').map(Number);

  // Compra em dezembro lançada em janeiro: o ano é o anterior.
  const purchaseIsAfterStatement =
    pMonth > sMonth || (pMonth === sMonth && pDay > sDay);
  const year = purchaseIsAfterStatement ? sYear - 1 : sYear;

  return `${String(pDay).padStart(2, '0')}/${String(pMonth).padStart(2, '0')}/${year}`;
};


exports.parseBankSheet = async (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Cada linha vira um array: [coluna A, coluna B, coluna C, coluna D]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // ---------- Período ----------
  const periodRow = rows.find(
    (row) => normalizeText(row[0]) === 'PERIODO DO EXTRATO'
  );
  const periodLabel = String(periodRow?.[1] ?? '').trim();
  const periodMatch = periodLabel.match(
    /^(\d{2}\/\d{2}\/\d{4})\s+a\s+(\d{2}\/\d{2}\/\d{4})$/i
  );

  const statement = {
    periodStart: periodMatch ? toISODate(periodMatch[1]) : null,
    periodEnd: periodMatch ? toISODate(periodMatch[2]) : null,
    periodLabel: periodLabel || null,
  };

  // ---------- Lançamentos: tudo depois da linha "Data | Descrição" ----------
  const headerIndex = rows.findIndex(
    (row) =>
      normalizeText(row[0]) === 'DATA' &&
      normalizeText(row[1]) === 'DESCRICAO'
  );
  const dataRows = headerIndex === -1 ? [] : rows.slice(headerIndex + 1);

  // ---------- Categorias ----------
  const categories = await CategoryInfo.find().lean();
  const categoryMap = new Map(
    categories.map((c) => [normalizeText(c.fantasyName), c])
  );

  // ---------- Transações ----------
  const formatted = dataRows
    .map(([rawDate, rawDescription, rawValue]) => {
      const dateText = String(rawDate ?? '').trim();
      const amount = parseAmount(rawValue);

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateText)) return null;
      if (!rawDescription || amount == null) return null;

      const { type, purchaseDate, name } = splitDescription(rawDescription);
      if (!type) return null;

      // Usa a data da compra (17/10) em vez da data do extrato (19/10)
      const date = formatDateHeader(resolvePurchaseDate(dateText, purchaseDate));
      if (!date) return null;

      // Fantasy name special cases




console.log(type)
      const special = findSpecialRule(type);

      const fantasyName = special?.fantasyName ?? normalizeText(name || type);
      const categoryInfo = categoryMap.get(fantasyName);

      return {
        date,
        fantasyName,
        name: special?.companyName ?? categoryInfo?.companyName ?? '',
        description: '', // preenchido no client
        categoryId: special?.categoryId ?? categoryInfo?.categoryId ?? 'uncategorized',
        paymentType: getPaymentType(type),
        value: Math.abs(amount),
        currentInstallment: 1,
        totalInstallment: 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const bankTransactions = await checkForDuplicateTransactions(formatted);

  return {
    statement,
    summary: {
      totalTransactions: formatted.length,
      totalReturned: bankTransactions.length,
    },
    transactions: bankTransactions,
  };
};