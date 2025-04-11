const service = require('../models/category.model');

exports.getCategory = async () => {
  const data = await service.find();

  const result = data
    .map((item) => ({
      id: item.id,
      label: item.label,
      color: item.color,
      maxValue: item.maxValue,
    }))
    .sort((a, b) => {
      if (a.id === 'all_categories') return -1;
      if (b.id === 'all_categories') return 1;
      return 0;
    });

  return result;
};

exports.updateCategory = async (data) => {
  try {
    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { id: item.id }, // Match documents by "id"
        update: { $set: item }, // Update fields with new values
        upsert: true, // Insert document if it doesn't exist
      },
    }));

    const result = await service.bulkWrite(bulkOps);
    console.log('Collection updated successfully', result.nModified);
    return result;
  } catch (error) {
    console.error('Error updating collection:', error);
  }
};
