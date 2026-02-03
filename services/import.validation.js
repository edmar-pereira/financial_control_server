const { buildDuplicateKey } = require('./installment.helper');
const expenseService = require('./expense.service');
const { normalizeKey } = require('../utils/normalizeKey');

exports.validateImport = async (rows) => {
  const existing = await expenseService.findByCompositeKeys(rows);

  const dbKeys = new Set(existing.map(buildDuplicateKey));
  const fileKeys = new Set();

  const validRows = [];
  const duplicated = [];

  for (const row of rows) {
    const key = buildDuplicateKey(row);

    const duplicateInFile = fileKeys.has(key);
    const duplicateInDB = dbKeys.has(key);

    fileKeys.add(key);

    if (duplicateInFile || duplicateInDB || !row.name?.trim()) {
      duplicated.push({
        ...row,
        reason: duplicateInFile
          ? 'DUPLICATE_IN_FILE'
          : duplicateInDB
            ? 'DUPLICATE_IN_DB'
            : 'INVALID_NAME',
      });
    } else {
      validRows.push(row);
    }
  }

  return { validRows, duplicated };
};
