// services/installmentCalc.js

function moveTransactionToStatementMonth(
  transaction,
  statementYear,
  statementMonth,
) {
  const results = [];

  // DATA ORIGINAL DA COMPRA
  const originalPurchaseDate = transaction.date;

  const baseDate = new Date(originalPurchaseDate);

  // evita timezone
  const purchaseDay = baseDate.getUTCDate();

  // GARANTE NÚMEROS
  const currentInstallment = Number(transaction.currentInstallment) || 1;

  const totalInstallment = Number(transaction.totalInstallment) || 1;

  /* -------------------------------------------------
     GERA PARCELAS
  -------------------------------------------------- */
  for (
    let installment = currentInstallment;
    installment <= totalInstallment;
    installment++
  ) {
    // diferença entre parcela atual e futura
    const monthOffset = installment - currentInstallment;

    // gera mês da fatura
    const installmentDate = new Date(
      Date.UTC(statementYear, statementMonth - 1 + monthOffset, 1),
    );

    // preserva dia da compra
    const lastDayOfMonth = new Date(
      Date.UTC(
        installmentDate.getUTCFullYear(),
        installmentDate.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();

    const safeDay = Math.min(purchaseDay, lastDayOfMonth);

    installmentDate.setUTCDate(safeDay);

    results.push({
      ...transaction,

      // DATA ORIGINAL DA COMPRA
      originalPurchaseDate,

      // DATA DA FATURA/PARCELA
      date: installmentDate.toISOString().slice(0, 10),

      // PARCELA GERADA
      currentInstallment: installment,
    });
  }

  return results;
}

module.exports = {
  moveTransactionToStatementMonth,
};
