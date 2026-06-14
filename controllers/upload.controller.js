const { uploadFile } = require('../services/upload.service');

exports.uploadData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
      });
    }

    const statementMonth = Number(req.body.statementMonth);
    const statementYear = Number(req.body.statementYear);

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

    console.log('📥 File received in controller:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      statementMonth,
      statementYear,
    });

    // envia também os dados da fatura
    const data = await uploadFile({
      file: req.file,
      statementMonth,
      statementYear,
    });

    res.json({
      status: 200,
      count: Array.isArray(data) ? data.length : undefined,
      data,
    });
  } catch (err) {
    console.error('❌ Error uploading file:', err);

    res.status(500).json({
      error: err.message,
    });
  }
};
