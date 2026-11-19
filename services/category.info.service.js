const mongoose = require('mongoose');
const service = require('../models/category.info.model');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getCategoryInfo = async () => {
  return await service.find();
};

exports.createCategoryInfo = async (data) => {
  const fantasyName = data.fantasyName.trim().toUpperCase();

  const updatePayload = {
    categoryId: data.categoryId,
  };

  if (data.companyName && data.companyName.trim() !== '') {
    updatePayload.companyName = data.companyName.trim();
  }

  await service.updateOne(
    { fantasyName },
    { $set: updatePayload },
    { upsert: true },
  );
};

// autocomplete de Nome Fantasia / Nome da Empresa
exports.getUniqueCategoryInfo = async (value) => {
  const query = {};

  if (value) {
    const safe = escapeRegex(value);

    query.$or = [
      { fantasyName: { $regex: safe, $options: 'i' } },
      { companyName: { $regex: safe, $options: 'i' } },
    ];
  }

  return service
    .find(query)
    .select('fantasyName companyName -_id')
    .sort({ fantasyName: 1 })
    .lean();
};

// edição pela tela de cadastros (recebe um array)
exports.updateCategoryInfo = async (items) => {
  if (!Array.isArray(items) || !items.length) return { modifiedCount: 0 };

  const ops = items
    .map((item) => ({ ...item, _id: item._id ?? item.id })) // aceita id ou _id
    .filter((item) => mongoose.Types.ObjectId.isValid(item._id))
    .map((item) => {
      const $set = {};

      if (item.fantasyName !== undefined) {
        // bulkWrite não aplica os setters do schema, então padroniza aqui
        $set.fantasyName = String(item.fantasyName).trim().toUpperCase();
      }
      if (item.companyName !== undefined) {
        $set.companyName = String(item.companyName).trim();
      }
      if (item.categoryId !== undefined) {
        $set.categoryId = item.categoryId;
      }

      return {
        updateOne: {
          filter: { _id: item._id },
          update: { $set },
          upsert: false,
        },
      };
    })
    .filter((op) => Object.keys(op.updateOne.update.$set).length > 0);

  if (!ops.length) return { modifiedCount: 0 };

  const result = await service.bulkWrite(ops);
  return { modifiedCount: result.modifiedCount };
};

exports.deleteCategoryInfo = async (id) => {
  return await service.findByIdAndDelete(id);
};