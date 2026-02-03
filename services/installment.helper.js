exports.computeStatementDate = (purchaseDate, currentInstallment = 1) => {
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + (currentInstallment - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.buildDuplicateKey = (row) => {
  const purchaseDate =
    row.date instanceof Date
      ? row.date
      : new Date(`${row.date}T00:00:00.000Z`);

  const date = exports.computeStatementDate(
    purchaseDate,
    row.currentInstallment ?? 1
  );

  return `${row.fantasyName}|${date.toISOString()}|${Number(row.value)}`;
};
