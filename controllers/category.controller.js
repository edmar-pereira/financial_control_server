const service = require('../services/category.service');
const categoryInfoService = require('../services/category.info.service');

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

exports.getUniqueCompanyName = async (req, res) => {
  const { name } = req.query;

  const data = await service.getUniqueCompanyName(name);

  res.json({ data });
};

exports.getAllCategoryInfo = async (req, res) => {
  try {
    const data = await categoryInfoService.getCategoryInfo();
    res.json({ data, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
