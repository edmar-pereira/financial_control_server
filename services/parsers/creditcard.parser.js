// services/parsers/creditcard.parser.js

const { parse } = require('csv-parse/sync');

const CategoryInfo = require('../../models/category.info.model');

const {
  checkForDuplicateTransactions,
} = require('../../utils/checkForDuplicateTransactions');

/* -------------------------------------------------
   HELPERS
-------------------------------------------------- */

// Remove BOM, colapsa espaços duplos/NBSP e põe em maiúsculas
const normalizeName = (str = '') =>
  String(str)
    .replace(/^\ufeff/, '')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim()
    .toUpperCase();

// "R$ -6.406,63" | "R$\u00a019,90" | "19,90" -> número positivo
const parseBRLToPositive = (raw = '') => {
  const cleaned = String(raw)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const n = Number.parseFloat(cleaned);

  return Number.isNaN(n) ? 0 : Math.abs(n);
};

// Detecta ; , ou TAB olhando só o cabeçalho
const detectDelimiter = (csvString) => {
  const header = csvString.replace(/^\ufeff/, '').split(/\r?\n/)[0] || '';

  const semicolons = (header.match(/;/g) || []).length;
  const commas = (header.match(/,/g) || []).length;
  const tabs = (header.match(/\t/g) || []).length;

  if (tabs > semicolons && tabs > commas) return '\t';

  return semicolons >= commas ? ';' : ',';
};

// "dd/mm/yyyy" -> "yyyy-mm-dd" (ou null)
const toISODate = (rawDate) => {
  const match = String(rawDate || '')
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;

  return `${year}-${month}-${day}`;
};

// "3 de 12" -> true | "-" / "de 1" / vazio -> false
const isInstallment = (parcelText) => {
  const match = String(parcelText || '').match(/(\d+)\s*de\s*(\d+)/i);

  if (!match) return false;

  return Number.parseInt(match[2], 10) > 1;
};

/**
 * Faz parse do CSV do cartão.
 * Importa SOMENTE compras à vista; parceladas são lançadas manualmente.
 * A data salva é a data real da compra.
 * Retorna { transactions, skippedInstallments }.
 */
exports.parseCreditCardSheet = async (buffer) => {
  try {
    /* -------------------------------------------------
       CATEGORIAS
    -------------------------------------------------- */
    const categories = await CategoryInfo.find().lean();

    const categoryMap = new Map();

    categories.forEach((category) => {
      categoryMap.set(normalizeName(category.fantasyName), category);
    });

    /* -------------------------------------------------
       CSV
    -------------------------------------------------- */
    const csvString = buffer.toString('utf-8');

    const records = parse(csvString, {
      columns: (header) =>
        header.map((h) => String(h).replace(/^\ufeff/, '').trim()),
      delimiter: detectDelimiter(csvString),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });

    /* -------------------------------------------------
       LOOP
    -------------------------------------------------- */
    const parsedData = [];

    const skippedInstallments = [];

    for (const row of records) {
      const fantasyName = normalizeName(row['Estabelecimento']);

      // ignora vazios e pagamento de fatura
      if (!fantasyName || fantasyName === 'PAGAMENTO DE FATURA') {
        continue;
      }

      const purchaseDate = toISODate(row['Data']);

      if (!purchaseDate) {
        continue;
      }

      // parceladas: não importa, apenas registra para avisar o usuário
      if (isInstallment(row['Parcela'])) {
        skippedInstallments.push({
          date: purchaseDate,
          fantasyName,
          value: parseBRLToPositive(row['Valor']),
          installment: String(row['Parcela']).trim(),
        });

        continue;
      }

      const categoryInfo = categoryMap.get(fantasyName);

      parsedData.push({
        date: purchaseDate,

        fantasyName,

        name: categoryInfo?.companyName || '',

        description: '',

        categoryId: categoryInfo?.categoryId || 'uncategorized',

        paymentType: 'CREDITO',

        value: parseBRLToPositive(row['Valor']),

        currentInstallment: 1,

        totalInstallment: 1,

        duplicated: false,

        originalPurchaseDate: purchaseDate,
      });
    }

    /* -------------------------------------------------
       ORDENA
    -------------------------------------------------- */
    parsedData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    /* -------------------------------------------------
       DUPLICIDADE
    -------------------------------------------------- */
    const transactions = await checkForDuplicateTransactions(parsedData);

    skippedInstallments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return { transactions, skippedInstallments };
  } catch (error) {
    console.error('❌ Error parsing credit card CSV:', error);

    throw new Error('Failed to parse credit card CSV');
  }
};