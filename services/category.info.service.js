const service = require('../models/category.info.model');

exports.getCategoryInfo = async () => {
  return await service.find();
};

exports.createCategoryInfo = async (data) => {
  const fantasyName = data.fantasyName.trim().toUpperCase();

  const updatePayload = {
    categoryId: data.categoryId,
  };

  // 🔥 update companyName
  if (data.companyName && data.companyName.trim() !== '') {
    updatePayload.companyName = data.companyName.trim();
  }

  await service.updateOne(
    { fantasyName },
    { $set: updatePayload },
    { upsert: true },
  );
};

exports.deleteCategoryInfo = async (id) => {
  return await service.findByIdAndDelete(id);
};