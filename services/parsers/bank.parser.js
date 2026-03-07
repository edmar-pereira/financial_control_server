const XLSX = require('xlsx');
const CategoryInfo = require('../../models/category.info.model');

const { formatDateHeader } = require('../../utils/format');
const { AcceptThisPattern, toPositiveBRL } = require('../../utils/format');

exports.parseBankSheet = async (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  /* -------------------------------------------------
     🔥 BUSCA DIRETO DO BANCO (SEM CACHE)
  -------------------------------------------------- */
  const categories = await CategoryInfo.find().lean();

  const categoryMap = new Map();
  categories.forEach((c) => {
    categoryMap.set(c.fantasyName, c);
  });

  /* -------------------------------------------------
     🔥 NORMALIZE PAYMENT TYPE
  -------------------------------------------------- */
  const normalizePaymentType = (rawType = '') => {
    const type = rawType.toUpperCase();

    if (type.includes('DEBITO')) return 'DEBITO';
    if (type.includes('PIX')) return 'PIX';
    if (type.includes('SAQUE')) return 'SAQUE';
    if (type.includes('BOLETO')) return 'BOLETO';
    if (type.includes('LIQUIDO DE VENCIMENTO')) return 'PAGAMENTO';
    if (type.includes('JUROS')) return 'JUROS';
    if (type.includes('INVESTIMENTO')) return 'INVESTIMENTO';
    if (type.includes('CREDITO')) return 'CREDITO';

    return 'OUTROS';
  };

  const splitMainType = (text = '') => {
    const match = new RegExp(/^(.+?)\s{2,}(.+)$/).exec(text);

    let type = match ? match[1].trim() : text.trim();
    let name = match ? match[2].trim() : '';

    name = name.replace(/^\d{2}\/\d{2}\s+/, '');
    name = name.trim().toUpperCase();

    return { type, name };
  };

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

      const buildResult = (fantasyName, paymentType, value) => {
        const categoryInfo = categoryMap.get(fantasyName);

        return {
          ...base,
          fantasyName,
          name: categoryInfo?.companyName || '',
          description: categoryInfo?.description || '',
          categoryId: categoryInfo?.categoryId || 'uncategorized',
          paymentType: normalizePaymentType(paymentType),
          value,
        };
      };

      /* --------------------------
         REGRAS ESPECIAIS
      --------------------------- */

      if (mainType.includes('SAQUE DINHEIRO')) {
        return buildResult(
          'SAQUE DINHEIRO BANCO 24H',
          'SAQUE',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('PIX ENVIADO')) {
        const { name } = splitMainType(mainType);

        return buildResult(
          name,
          'INVESTIMENTO',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('PIX RECEBIDO')) {
        const { name } = splitMainType(mainType);

        return buildResult(
          name,
          'PIX',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_3'])),
        );
      }

      if (mainType.includes('APLICACAO CDB/RDB')) {
        return buildResult(
          row['__EMPTY'],
          'INVESTIMENTO',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('IOF ADICIONAL')) {
        return buildResult(
          'IOF ADICIONAL',
          'JUROS',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('IOF IMPOSTO OPERACOES FINANCEIRAS')) {
        return buildResult(
          'IOF IMPOSTO OPERACOES FINANCEIRAS',
          'JUROS',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('JUROS SALDO UTILIZ ATE LIMITE')) {
        return buildResult(
          'JUROS SALDO UTILIZ ATE LIMITE',
          'JUROS',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
        );
      }

      if (mainType.includes('CNPJ 033372251000156')) {
        const { name } = splitMainType(mainType);

        return buildResult(
          name,
          'LIQUIDO DE VENCIMENTO',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_3'])),
        );
      }

      if (mainType.includes('REMUNERACAO APLICACAO AUTOMATICA')) {
        return buildResult(
          row['__EMPTY'],
          'CREDITO',
          Number.parseFloat(toPositiveBRL(row['__EMPTY_3'])),
        );
      }

      /* --------------------------
         REGRA PADRÃO
      --------------------------- */

      const { type, name } = splitMainType(mainType);

      return buildResult(
        name,
        type,
        Number.parseFloat(toPositiveBRL(row['__EMPTY_4'])),
      );
    })
    .filter(Boolean);

  formatted.sort((a, b) => new Date(a.date) - new Date(b.date));

  return formatted;
};
