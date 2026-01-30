const { parse } = require('csv-parse/sync');
const { toPositiveBRL } = require('../../utils/format');
const { getCategoryCache, getCategoryFromCache } = require('../category.cache');

/**
 * Faz o parse de um arquivo CSV de fatura de cartão de crédito.
 * @param {Buffer} buffer - Conteúdo do arquivo CSV.
 * @returns {Array<Object>} Dados formatados.
 */
exports.parseCreditCardSheet = async (buffer) => {
  try {
    // 🔥 Uma chamada cacheada para categorias
    const categoryMap = await getCategoryCache();
    const csvString = buffer.toString('utf-8');

    // Parse do CSV
    const records = parse(csvString, {
      columns: true,
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
    });

    const parsedData = records
      .map((row) => {
        const fantasyName = row['Estabelecimento']?.trim() || '';

        // 🔹 Ignorar pagamentos de fatura
        if (fantasyName === 'Pagamento de fatura') return null;

        const rawDate = row['\ufeffData']?.trim() || row['Data']?.trim();
        const [day, month, year] = rawDate?.split('/') || [];
        const date =
          year && month && day
            ? new Date(`${year}-${month}-${day}T00:00:00Z`)
                .toISOString()
                .split('T')[0]
            : null;

        const category = getCategoryFromCache(categoryMap, fantasyName);

        // 🔹 Processar parcelas
        let currentInstallment = 1;
        let totalInstallment = 1;
        const parcelText = row['Parcela']?.trim(); // ex: "1 de 6"
        if (parcelText && parcelText.includes('de')) {
          const [curr, total] = parcelText
            .split('de')
            .map((v) => parseInt(v.trim(), 10));
          if (!isNaN(curr) && !isNaN(total)) {
            currentInstallment = curr;
            totalInstallment = total;
          }
        }

        return {
          date,
          fantasyName,
          name: category.name || '',
          description: '',
          categoryId: category.category || 'uncategorized',
          paymentType: 'CREDIT_CARD',
          value: parseFloat(toPositiveBRL(row['Valor'])), // número com 2 casas
          currentInstallment,
          totalInstallment,
        };
      })
      .filter(Boolean); // remove entradas null (Pagamento de fatura)

    console.log('🧾 Parsed credit card data:', parsedData.slice(0, 3));
    parsedData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return parsedData;
  } catch (error) {
    console.error('❌ Error parsing credit card CSV:', error.message);
    throw new Error('Failed to parse credit card CSV');
  }
};
