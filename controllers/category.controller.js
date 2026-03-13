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
    if (!Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Body must be an array',
      });
    }

    const data = await service.updateCategory(req.body);

    res.json({
      status: 200,
      data,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
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

exports.deleteCategoryInfo = async (req, res) => {
  try {
    const result = await categoryInfoService.deleteCategoryInfo(req.params.id);
    res.json({ data: result, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};  
