exports.normalizeKey = (row) => {
  return [
    row.fantasyName?.trim().toUpperCase(),
    new Date(row.date).toISOString().slice(0, 10), // YYYY-MM-DD
    Number(row.value).toFixed(2),
  ].join('|');
};
