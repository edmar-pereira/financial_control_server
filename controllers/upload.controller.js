const { uploadFile } = require('../services/upload.service');

exports.uploadData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📥 File received in controller:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Pass the file directly — the service will detect type by mimetype
    const data = await uploadFile(req.file);

    res.json({
      status: 'success',
      count: Array.isArray(data) ? data.length : undefined,
      data,
    });
  } catch (err) {
    console.error('❌ Error uploading file:', err);
    res.status(500).json({ error: err.message });
  }
};
