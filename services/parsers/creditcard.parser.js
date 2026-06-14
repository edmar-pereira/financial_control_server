// services/parsers/creditcard.parser.js

const { parse } = require(
  'csv-parse/sync',
);

const {
  toPositiveBRL,
} = require('../../utils/format');

const CategoryInfo = require(
  '../../models/category.info.model',
);

const {
  checkForDuplicateTransactions,
} = require(
  '../../utils/checkForDuplicateTransactions',
);

const {
  moveTransactionToStatementMonth,
} = require('../installmentCalc');

/**
 * Faz parse do CSV do cartão
 */
exports.parseCreditCardSheet =
  async (
    buffer,
    {
      statementMonth,
      statementYear,
    },
  ) => {
    try {
      /* -------------------------------------------------
         CATEGORIAS
      -------------------------------------------------- */
      const categories =
        await CategoryInfo.find().lean();

      const categoryMap =
        new Map();

      categories.forEach(
        (category) => {
          categoryMap.set(
            category.fantasyName,
            category,
          );
        },
      );

      /* -------------------------------------------------
         CSV
      -------------------------------------------------- */
      const csvString =
        buffer.toString('utf-8');

      const records = parse(
        csvString,
        {
          columns: true,
          delimiter: ';',
          skip_empty_lines: true,
          trim: true,
        },
      );

      /* -------------------------------------------------
         RESULTADO
      -------------------------------------------------- */
      const parsedData = [];

      /* -------------------------------------------------
         LOOP
      -------------------------------------------------- */
      for (const row of records) {
        let fantasyName =
          row[
            'Estabelecimento'
          ]?.trim() || '';

        /* ---------------------------
           IGNORA FATURA
        ---------------------------- */
        if (
          fantasyName ===
          'Pagamento de fatura'
        ) {
          continue;
        }

        /* ---------------------------
           NORMALIZA
        ---------------------------- */
        fantasyName =
          fantasyName.toUpperCase();

        /* ---------------------------
           DATA ORIGINAL
        ---------------------------- */
        const rawDate =
          row[
            '\ufeffData'
          ]?.trim() ||
          row['Data']?.trim();

        const [
          day,
          month,
          year,
        ] =
          rawDate?.split('/') ||
          [];

        const purchaseDate =
          year &&
          month &&
          day
            ? `${year}-${month}-${day}`
            : null;

        if (!purchaseDate) {
          continue;
        }

        /* ---------------------------
           CATEGORIA
        ---------------------------- */
        const categoryInfo =
          categoryMap.get(
            fantasyName,
          );

        /* ---------------------------
           PARCELAS
        ---------------------------- */
        let currentInstallment = 1;

        let totalInstallment = 1;

        const parcelText =
          row[
            'Parcela'
          ]?.trim();

        // ex: "3 de 12"
        if (
          parcelText?.includes(
            'de',
          )
        ) {
          const [
            curr,
            total,
          ] = parcelText
            .split('de')
            .map((value) =>
              Number.parseInt(
                value.trim(),
                10,
              ),
            );

          if (
            !Number.isNaN(
              curr,
            ) &&
            !Number.isNaN(
              total,
            )
          ) {
            currentInstallment =
              curr;

            totalInstallment =
              total;
          }
        }

        /* ---------------------------
           TRANSAÇÃO BASE
        ---------------------------- */
        const transaction = {
          // DATA ORIGINAL
          date: purchaseDate,

          fantasyName,

          name:
            categoryInfo?.companyName ||
            '',

          description: '',

          categoryId:
            categoryInfo?.categoryId ||
            'uncategorized',

          paymentType:
            'CREDITO',

          value:
            Number.parseFloat(
              toPositiveBRL(
                row['Valor'],
              ),
            ),

          currentInstallment,

          totalInstallment,

          duplicated: false,
        };

        /* ---------------------------
           GERA PARCELAS
        ---------------------------- */
        const installments =
          moveTransactionToStatementMonth(
            transaction,
            statementYear,
            statementMonth,
          );

        /* ---------------------------
           ADICIONA
        ---------------------------- */
        if (
          Array.isArray(
            installments,
          ) &&
          installments.length >
            0
        ) {
          parsedData.push(
            ...installments,
          );
        }
      }

      /* -------------------------------------------------
         ORDENA
      -------------------------------------------------- */
      parsedData.sort(
        (a, b) => {
          return (
            new Date(
              a.date,
            ).getTime() -
            new Date(
              b.date,
            ).getTime()
          );
        },
      );

      /* -------------------------------------------------
         DUPLICIDADE
      -------------------------------------------------- */
      const creditCardTransactions =
        await checkForDuplicateTransactions(
          parsedData,
        );

      return creditCardTransactions;
    } catch (error) {
      console.error(
        '❌ Error parsing credit card CSV:',
        error,
      );

      throw new Error(
        'Failed to parse credit card CSV',
      );
    }
  };