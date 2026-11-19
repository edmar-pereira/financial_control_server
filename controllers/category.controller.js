const service = require('../services/category.service');
const categoryInfoService = require('../services/category.info.service');

/* ---------------- CATEGORIES ---------------- */

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
      return res.status(400).json({ error: 'Body must be an array' });
    }

    const data = await service.updateCategory(req.body);

    res.json({ status: 200, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ---------------- CATEGORY INFO ---------------- */

exports.getUniqueCompanyName = async (req, res) => {
  try {
    const { value } = req.query;
    const data = await categoryInfoService.getUniqueCategoryInfo(value);

    res.json({ status: 200, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCategoryInfo = async (req, res) => {
  try {
    const data = await categoryInfoService.getCategoryInfo();
    res.json({ data, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategoryInfo = async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Body must be an array' });
    }

    const data = await categoryInfoService.updateCategoryInfo(req.body);
    res.json({ status: 200, data });
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