const service = require('../services/data.service');

exports.getData = async (req, res) => {
  try {
    const data = await service.getData(req.query);
    res.json({ data, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonths = async (req, res) => {
  try {
    const arrMonths = await service.getMonths();
    res.json({ arrMonths, status: 200 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createData = async (req, res) => {
  try {
    const data = await service.createData(req.body);
    res.json({ data, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByIdData = async (req, res) => {
  try {
    const data = await service.getByIdData(req.params.id);
    res.json({ data, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateData = async (req, res) => {
  try {
    const data = await service.updateData(req.params.id, req.body);
    res.json({ data, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteByIdData = async (req, res) => {
  try {
    const data = await service.deleteData(req.params.id);
    res.json({ data, status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
