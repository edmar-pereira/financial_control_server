const service = require('../models/category.info.model');

exports.getCategoryInfo = async () => {
  return await service.find();
};

exports.createCategoryInfo = async (data) => {
  const fantasyName = data.fantasyName.trim().toUpperCase();

  const updatePayload = {
    categoryId: data.categoryId,
  };

  // 🔥 Só atualiza name se vier preenchido
  if (data.name && data.name.trim() !== '') {
    updatePayload.name = data.name.trim();
  }

  // 🔥 Só atualiza description se vier preenchida
  // if (data.description && data.description.trim() !== '') {
  //   updatePayload.description = data.description.trim();
  // }

  await service.updateOne(
    { fantasyName },
    { $set: updatePayload },
    { upsert: true },
  );
};
