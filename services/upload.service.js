const { parseBankSheet } = require('./parsers/bank.parser');

const { parseCreditCardSheet } = require('./parsers/creditcard.parser');

exports.uploadFile = async ({ file, body }) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const mimetype = file.mimetype || '';

  // CSV = cartão
  if (mimetype.includes('csv')) {

    const statementMonth = Number(body.statementMonth);
    const statementYear = Number(body.statementYear);

    // validações
    if (!statementMonth || statementMonth < 1 || statementMonth > 12) {
      return res.status(400).json({
        error: 'Invalid statement month',
      });
    }

    if (!statementYear || statementYear < 2000) {
      return res.status(400).json({
        error: 'Invalid statement year',
      });
    }
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
