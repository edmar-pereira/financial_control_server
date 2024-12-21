const service = require('../services/category.service');

exports.getCategory = async (req, res) => {
  try {
    const data = await service.getCategory();

    res.json({ data, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updateCategory = async (req, res) => {
  try {
    const data = await service.updateCategory(req.body);
    res.json({ data, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

