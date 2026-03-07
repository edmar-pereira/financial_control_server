const { parse } = require('csv-parse/sync');
const { toPositiveBRL } = require('../../utils/format');
const CategoryInfo = require('../../models/category.info.model');

/**
 * Faz o parse de um arquivo CSV de fatura de cartão de crédito.
 * @param {Buffer} buffer - Conteúdo do arquivo CSV.
 * @returns {Array<Object>} Dados formatados.
 */
exports.parseCreditCardSheet = async (buffer) => {
  try {
    /* -------------------------------------------------
       🔥 BUSCA CATEGORIAS DIRETO DO BANCO
    -------------------------------------------------- */
    const categories = await CategoryInfo.find().lean();

    const categoryMap = new Map();
    categories.forEach((c) => {
      categoryMap.set(c.fantasyName, c);
    });

    const csvString = buffer.toString('utf-8');

    const records = parse(csvString, {
      columns: true,
      delimiter: ';',
      skip_empty_lines: true,
      trim: true,
    });

    const parsedData = records
      .map((row) => {
        let fantasyName = row['Estabelecimento']?.trim() || '';

        // 🔹 Ignorar pagamentos de fatura
        if (fantasyName === 'Pagamento de fatura') return null;

        // 🔥 Normalização obrigatória
        fantasyName = fantasyName.toUpperCase();

        /* ---------------------------
           DATA
        ---------------------------- */
        const rawDate = row['\ufeffData']?.trim() || row['Data']?.trim();

        const [day, month, year] = rawDate?.split('/') || [];

        const date =
          year && month && day
            ? new Date(`${year}-${month}-${day}T00:00:00Z`)
                .toISOString()
                .split('T')[0]
            : null;

        /* ---------------------------
           BUSCAR CATEGORIA
        ---------------------------- */
        const categoryInfo = categoryMap.get(fantasyName);

        /* ---------------------------
           PARCELAS
        ---------------------------- */
        let currentInstallment = 1;
        let totalInstallment = 1;

        const parcelText = row['Parcela']?.trim(); // ex: "1 de 6"

        if (parcelText?.includes('de')) {
          const [curr, total] = parcelText
            .split('de')
            .map((v) => Number.parseInt(v.trim(), 10));

          if (!Number.isNaN(curr) && !Number.isNaN(total)) {
            currentInstallment = curr;
            totalInstallment = total;
          }
        }

        return {
          date,
          fantasyName,
          name: categoryInfo?.companyName || '',
          description: '',
          categoryId: categoryInfo?.categoryId || 'uncategorized',
          paymentType: 'CREDIT_CARD',
          value: Number.parseFloat(toPositiveBRL(row['Valor'])),
          currentInstallment,
          totalInstallment,
        };
      })
      .filter(Boolean);

    parsedData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return parsedData;
  } catch (error) {
    console.error('❌ Error parsing credit card CSV:', error.message);
    throw new Error('Failed to parse credit card CSV');
  }
};
