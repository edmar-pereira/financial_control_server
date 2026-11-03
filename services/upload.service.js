const { parseBankSheet } = require('./parsers/bank.parser');

const { parseCreditCardSheet } = require('./parsers/creditcard.parser');

exports.uploadFile = async ({ file, body }) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const mimetype = file.mimetype || '';

  // CSV = cartão
  if (mimetype.includes('csv')) {
    return await parseCreditCardSheet(file.buffer);
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
