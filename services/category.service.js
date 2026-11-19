const Category = require('../models/category.model');

exports.getCategory = async () => {
  const data = await Category.find().lean();

  return data
    .map(({ id, label, color, maxValue }) => ({ id, label, color, maxValue }))
    .sort((a, b) => {
      if (a.id === 'all_categories') return -1;
      if (b.id === 'all_categories') return 1;
      return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
    });
};

exports.updateCategory = async (items) => {
  if (!Array.isArray(items) || !items.length) return { modifiedCount: 0 };

  const ops = items
    .filter((item) => item?.id)
    .map((item) => {
      const $set = {};
      if (item.maxValue !== undefined) $set.maxValue = Number(item.maxValue) || 0;
      if (item.color !== undefined) $set.color = String(item.color).trim();
      if (item.label !== undefined) $set.label = String(item.label).trim();

      return {
        updateOne: { filter: { id: item.id }, update: { $set }, upsert: false },
      };
    })
    .filter((op) => Object.keys(op.updateOne.update.$set).length > 0);

  if (!ops.length) return { modifiedCount: 0 };

  const result = await Category.bulkWrite(ops);
  return { modifiedCount: result.modifiedCount };
};