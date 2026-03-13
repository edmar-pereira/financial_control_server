const service = require('../models/category.model');

const categoryInfoService = require('../models/category.info.model');

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
  console.log(JSON.stringify(data));

  try {
    const bulkOps = data.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: {
          $set: {
            fantasyName: item.fantasyName,
            companyName: item.companyName,
            categoryId: item.categoryId,
          },
        },
        upsert: false,
      },
    }));

    const result = await categoryInfoService.bulkWrite(bulkOps);


    return result;
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

exports.getUniqueCompanyName = async (name) => {
  const query = {};

  if (name) {
    query.name = {
      $regex: name,
      $options: 'i',
    };
  }

  const companyName = await categoryInfoService.distinct('companyName', query);

  return companyName
    .filter((d) => d && d.trim() !== '')
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
};
