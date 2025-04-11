const service = require('../models/category.info.model');

exports.getCategoryInfo = async () => {
  const data = await service.find();
  return data;
};

exports.createCategoryInfo = async (data) => {
  await service.create(data);
};
