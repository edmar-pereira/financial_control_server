const moment = require('moment');
const service = require('../models/data.model');
const { ObjectId } = require('mongodb');

const {
  getCategoryInfo,
  createCategoryInfo,
} = require('../services/category.info.service');

function toPositiveBRL(value) {
  if (typeof value !== 'string') return 0;

  // Remove ONLY thousands separators (.) and replace decimal comma (,) with a dot (.)
  if (value.includes(',')) {
    // Remove thousands separator (.) and replace decimal comma (,) with a dot
    value = value.replace(/\./g, '').replace(',', '.');
  }

  // Convert to number safely
  let numericValue = parseFloat(value);

  // If conversion fails, return 0
  return isNaN(numericValue) ? 0 : Math.abs(numericValue);
}

function filterAll(data) {
  let totalRev = 0;
  let totalExp = 0;

  // console.log(data);

  data.forEach((e) => {
    if (e.categoryId === 'revenue' && e.ignore === false) {
      totalRev += e.value;
    } else if (e.ignore === false && e.categoryId !== 'stocks') {
      totalExp += e.value;
    }
  });

  let sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    expenses: sortedData,
    totalRev,
    totalExp,
    difference: totalRev - totalExp,
  };
}

exports.getData = async (params) => {
  const { startDate, endDate, categoryIds, descriptions, values } = params;

  if (!startDate) throw new Error('At least one date is required');

  let query = buildQuery(startDate, endDate, categoryIds, descriptions, values);

  const data = await service.find(query);
  // console.log(data)
  return filterAll(data);
};

// 🔹 Extracted function to build the query dynamically
const buildQuery = (startDate, endDate, categoryIds, descriptions, values) => {
  const query = {};

  // console.log("Params:", startDate, endDate, categoryIds, descriptions, values);

  // 🔹 1. Handle Date Filtering
  if (startDate) {
    let finalEndDate = endDate;

    // If no endDate is given, set it to the last day of the month
    if (!endDate) {
      const year = parseInt(startDate.split('-')[0], 10);
      const month = parseInt(startDate.split('-')[1], 10);

      // Get last day of the month
      const lastDay = new Date(year, month, 0).getDate();
      finalEndDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
    }

    query.date = {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
      $lte: new Date(`${finalEndDate}T23:59:59.999Z`),
    };
  }

  // 🔹 2. Category Filtering
  if (categoryIds?.length) {
    query.categoryId = { $in: categoryIds };
  }

  // 🔹 3. Description Filtering (Case-Insensitive & Partial Match)
  if (descriptions?.length) {
    const regexSafeDescriptions = descriptions.map((desc) =>
      desc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    query.description = {
      $regex: regexSafeDescriptions.join('|'),
      $options: 'i',
    };
  }

  // 🔹 4. Value Filtering (Allow decimals & match exact or near values)
  if (values?.length) {
    const parsedValues = values.map((v) => parseFloat(v));
    query.value = { $in: parsedValues };
  }
  return query;
};

const insertData = async (data) => {
  const savedCategory = await getCategoryInfo();

  const result = savedCategory.filter(
    (item) =>
      item.categoryId === data.categoryId &&
      item.fantasyName === data.fantasyName &&
      item.description === data.description
  );

  if (result.length === 0 && data.fantasyName !== undefined) {
    const newCategory = {
      fantasyName: data.fantasyName,
      description: data.description,
      categoryId: data.categoryId,
    };
    createCategoryInfo(newCategory);
  }

  const newData = {
    date: data.date,
    description: data.description,
    ignore: data.ignore,
    categoryId: data.categoryId,
    totalInstallment: data.totalInstallment,
    currentInstallment: data.currentInstallment, // Correctly set installment number
    value: toPositiveBRL(data.value),
  };

  await service.create(newData);
};

exports.createData = async (data) => {
  try {
    if (data.totalInstallment === 1) {
      return await insertData(data);
    } else {
      for (let index = 0; index < data.totalInstallment; index++) {
        const dateObj = new Date(data.date);
        dateObj.setMonth(dateObj.getMonth() + index); // Increment month for each installment

        await insertData({
          date: dateObj.toISOString(),
          description: data.description,
          ignore: false,
          categoryId: data.categoryId,
          totalInstallment: data.totalInstallment,
          currentInstallment: index + 1, // Correctly set installment number
          value: data.value,
        });
      }
    }
  } catch (e) {
    console.log(e);
  }

  // return await service.create(data);
};

exports.getByIdData = async (id) => {
  console.log(id);
  return await service.findOne({ _id: new ObjectId(id) });
};

exports.updateData = async (id, data) => {
  console.log(id, data);
  return await service.findByIdAndUpdate(id, data);
};

exports.deleteData = async (id) => {
  return await service.findByIdAndDelete(id);
};

exports.inserMany = async (data) => {
  // console.log(data);
  const processData = async (dataArray) => {
    await Promise.all(
      dataArray.map(async (item) => {
        await insertData({
          date: new Date(item.date).toISOString(),
          description: item.description,
          ignore: false,
          categoryId: item.type,
          totalInstallment: 1,
          currentInstallment: 1, // Correctly set installment number
          value: item.value,
          fantasyName: item.fantasyName,
        });
      })
    );

    console.log('All insertions completed!');
  };

  processData(data);
};
