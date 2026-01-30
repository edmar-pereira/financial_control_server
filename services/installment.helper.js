/**
 * purchaseDate + (currentInstallment - 1) months
 */
exports.computeStatementDate = (purchaseDate, currentInstallment = 1) => {
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + (currentInstallment - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Key used for duplicate detection
 */
exports.buildDuplicateKey = (row) => {
  const date = exports.computeStatementDate(
    row.date,
    row.currentInstallment ?? 1
  );

  return `${row.fantasyName}|${date.toISOString()}|${Number(row.value)}`;
};
