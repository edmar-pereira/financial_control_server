const { parseBankSheet } = require('./parsers/bank.parser');
const { parseCreditCardSheet } = require('./parsers/creditcard.parser');

exports.uploadFile = async (file) => {
  if (!file) throw new Error('No file provided');

  const mimetype = file.mimetype || '';
  console.log('📂 Uploaded file type:', mimetype);

  if (mimetype.includes('csv')) {
    return await parseCreditCardSheet(file.buffer);
  }

  if (
    mimetype.includes('excel') ||
    mimetype.includes('spreadsheetml') ||
    mimetype.includes('officedocument')
  ) {
    return await parseBankSheet(file.buffer);
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
};
