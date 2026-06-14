const { parseBankSheet } = require('./parsers/bank.parser');

const { parseCreditCardSheet } = require('./parsers/creditcard.parser');

exports.uploadFile = async ({ file, statementMonth, statementYear }) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const mimetype = file.mimetype || '';

  // CSV = cartão
  if (mimetype.includes('csv')) {
    return await parseCreditCardSheet(file.buffer, {
      statementMonth,
      statementYear,
    });
  }

  // Excel = banco
  if (
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheetml') ||
    mimetype.includes('officedocument')
  ) {
    return await parseBankSheet(file.buffer);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
};
