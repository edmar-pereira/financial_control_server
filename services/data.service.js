const moment = require('moment');
const DataModel = require('../models/data.model');
const { ObjectId } = require('mongodb');
const { validateImport } = require('./import.validation');
const {
  getCategoryInfo,
  createCategoryInfo,
} = require('./category.info.service');

/* ---------------- HELPERS ---------------- */

function toPositiveBRL(value) {
  if (typeof value === 'number') return Math.abs(value);

  if (typeof value === 'string') {
    if (value.includes(',')) {
      value = value.replace(/\./g, '').replace(',', '.');
    }
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? 0 : Math.abs(numericValue);
  }

  return 0;
}

/**
 * 💳 Compute statement date for installments
 * purchaseDate + (currentInstallment - 1) months
 */
function computeStatementDate(purchaseDate, currentInstallment = 1) {
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + (currentInstallment - 1));
  return d;
}

/* ---------------- GET DATA ---------------- */

function buildQuery(startDate, endDate, categoryIds, descriptions, valuesRange) {
  const query = {};

  if (startDate) {
    const finalEndDate =
      endDate ||
      (() => {
        const [y, m] = startDate.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        return `${y}-${m.toString().padStart(2, '0')}-${lastDay}`;
      })();

    query.date = {
      $gte: new Date(`${startDate}T00:00:00.000Z`),
      $lte: new Date(`${finalEndDate}T23:59:59.999Z`),
    };
  }

  if (categoryIds?.length) query.categoryId = { $in: categoryIds };

  if (descriptions?.length) {
    const safe = descriptions.map(d =>
      d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    query.description = { $regex: safe.join('|'), $options: 'i' };
  }

  if (valuesRange?.min != null || valuesRange?.max != null) {
    query.value = {};
    if (valuesRange.min != null) query.value.$gte = Number(valuesRange.min);
    if (valuesRange.max != null) query.value.$lte = Number(valuesRange.max);
  }

  return query;
}

function filterAll(data) {
  let totalRev = 0;
  let totalExp = 0;

  data.forEach(e => {
    if (e.categoryId === 'revenue') totalRev += e.value;
    else if (e.categoryId !== 'stocks') totalExp += e.value;
  });

  return {
    expenses: data.sort((a, b) => new Date(b.date) - new Date(a.date)),
    totalRev,
    totalExp,
    difference: totalRev - totalExp,
  };
}

exports.getData = async params => {
  if (!params.startDate) {
    throw new Error('At least one date is required');
  }

  const query = buildQuery(
    params.startDate,
    params.endDate,
    params.categoryIds,
    params.descriptions,
    params.valuesRange,
  );

  const data = await DataModel.find(query);
  return filterAll(data);
};

/* ---------------- CREATE SINGLE ---------------- */

async function insertData(data) {
  const savedCategory = await getCategoryInfo();

  const exists = savedCategory.find(
    item =>
      item.categoryId === data.categoryId &&
      item.fantasyName === data.fantasyName &&
      item.description === data.description,
  );

  if (!exists && data.fantasyName) {
    await createCategoryInfo({
      fantasyName: data.fantasyName,
      description: data.description,
      categoryId: data.categoryId,
    });
  }

  return DataModel.create({
    date: data.date, // already computed
    fantasyName: data.fantasyName ?? '',
    name: data.name ?? '',
    description: data.description ?? '',
    categoryId: data.categoryId,
    paymentType: data.paymentType ?? null,
    value: toPositiveBRL(data.value),
    currentInstallment: data.currentInstallment ?? 1,
    totalInstallment: data.totalInstallment ?? 1,
  });
}

exports.createData = async data => {
  const total = data.totalInstallment ?? 1;

  // ✅ Single payment
  if (total === 1) {
    return insertData({
      ...data,
      date: computeStatementDate(data.date, 1),
      currentInstallment: 1,
    });
  }

  // ✅ Installments
  const docs = [];

  for (let i = 0; i < total; i++) {
    docs.push(
      await insertData({
        ...data,
        date: computeStatementDate(data.date, i + 1),
        currentInstallment: i + 1,
      }),
    );
  }

  return docs;
};

/* ---------------- INSERT MANY (IMPORT) ---------------- */

exports.insertMany = async rows => {
  const { validRows, duplicated } = await validateImport(rows);

  if (validRows.length) {
    await DataModel.insertMany(
      validRows.map(r => ({
        ...r,
        date: computeStatementDate(
          r.date,
          r.currentInstallment ?? 1,
        ),
        value: Number(r.value),
      })),
      { ordered: false },
    );
  }

  return {
    inserted: validRows.length,
    skipped: duplicated.length,
    duplicated,
  };
};

/* ---------------- CRUD ---------------- */

exports.getByIdData = id =>
  DataModel.findOne({ _id: new ObjectId(id) });

exports.updateData = (id, data) =>
  DataModel.findByIdAndUpdate(id, data, { new: true });

exports.deleteData = id =>
  DataModel.findByIdAndDelete(id);
