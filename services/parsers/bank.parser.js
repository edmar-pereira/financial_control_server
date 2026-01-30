const XLSX = require('xlsx');

const {
  formatDateHeader,
  toPositiveBRL,
  parseTransaction,
  AcceptThisPattern,
} = require('../../utils/format');

const { getCategoryCache, getCategoryFromCache } = require('../category.cache');

exports.parseBankSheet = async (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const categoryMap = await getCategoryCache();

  const formatted = jsonData
    .map((row) => {
      if (!AcceptThisPattern(row['__EMPTY_1'])) return null;

      const mainType = row['__EMPTY'] || '';
      const headerDate = row['EXTRATO DE CONTA CORRENTE ']?.trim();

      const parsedDate = formatDateHeader(headerDate);

      const base = {
        date: parsedDate,
        fantasyName: '',
        name: '',
        description: '',
        categoryId: '',
        paymentType: '',
        value: 0,
        currentInstallment: 1,
        totalInstallment: 1,
      };

      const normalizePaymentType = (rawType = '') => {
        const type = rawType.toUpperCase();

        if (type.includes('DEBITO')) return 'DEBITO';
        if (type.includes('PIX')) return 'PIX';
        if (type.includes('SAQUE')) return 'SAQUE';
        if (type.includes('BOLETO')) return 'BOLETO';
        if (type.includes('LIQUIDO DE VENCIMENTO')) return 'PAGAMENTO';
        if (type.includes('JUROS SALDO UTILIZ ATE LIMITE')) return 'JUROS';
        if (type.includes('PAGAMENTO CONTA CELULAR EM CANAIS'))
          return 'AGENDAMENTO';
        if (type.includes('MENSALIDADE DE SEGURO')) return 'AGENDAMENTO';
        if (type.includes('CONTA DE AGUA E ESGOTO EM CANAIS'))
          return 'AGENDAMENTO';

        return 'OUTROS';
      };

      const buildResult = (fantasyName, paymentType, value) => {
        const category = getCategoryFromCache(categoryMap, fantasyName);

        return {
          ...base,
          fantasyName,
          name: category.name || '',
          categoryId: category.category || 'uncategorized',
          paymentType: normalizePaymentType(paymentType),
          value,
        };
      };

      // -----------------------------
      // FIXED SPLIT LOGIC (ONE TIME)
      // -----------------------------
      const splitMainType = (text = '') => {
        const match = text.match(/^(.+?)\s{2,}(.+)$/);
        return {
          type: match ? match[1].trim() : text.trim(),
          name: match ? match[2].trim() : text.trim(),
        };
      };

      if (mainType.includes('SAQUE DINHEIRO')) {
        return buildResult(
          'SAQUE DINHEIRO BANCO 24H',
          'SAQUE DINHEIRO',
          parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('PIX ENVIADO')) {
        const { name } = splitMainType(mainType);
        return buildResult(
          name,
          'PIX ENVIADO',
          parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (
        mainType.includes('PIX RECEBIDO') ||
        mainType.includes('LIQUIDO DE VENCIMENTO')
      ) {
        const { type, name } = splitMainType(mainType);
        return buildResult(
          name,
          type,
          parseFloat(toPositiveBRL(row['__EMPTY_3'])),
        );
      }

      if (mainType.includes('DEBITO VISA ELECTRON BRASIL')) {
        const val = parseTransaction(mainType);
        return buildResult(
          val.exp,
          'DEBITO',
          parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      // Fallback (safe)
      const { type, name } = splitMainType(mainType);

      return buildResult(
        name,
        type,
        parseFloat(toPositiveBRL(row['__EMPTY_4'])),
      );
    })
    .filter(Boolean);

  formatted.sort((a, b) => a.date - b.date);

  return formatted;
};
