const CategoryInfo = require('../models/category.info.model');

exports.autoRegisterCategory = async ({ fantasyName, categoryId }) => {
  if (!fantasyName || !categoryId) return;

  const exists = await CategoryInfo.exists({ fantasyName });

  if (exists) return;

  await CategoryInfo.create({
    fantasyName,
    categoryId,
    createdAt: new Date(),
  });

};
