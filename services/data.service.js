const DataModel = require('../models/data.model');
const { ObjectId } = require('mongodb');
const { createCategoryInfo } = require('./category.info.service');
const {
  computeStatementDate,
  getPurchaseDate,
} = require('./installment.helper');

/* ---------------- HELPERS ---------------- */

function toPositiveBRL(value) {
  if (typeof value === 'number') return Math.abs(value);

  if (typeof value === 'string') {
    if (value.includes(',')) {
      value = value.replaceAll('.', '').replace(',', '.');
    }
    const numericValue = Number.parseFloat(value);
    return Number.isNaN(numericValue) ? 0 : Math.abs(numericValue);
  }

  return 0;
}

/* ---------------- QUERY HELPERS ---------------- */

function buildQuery(
  startDate,
  endDate,
  categoryIds,
  descriptions,
  valuesRange,
) {
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
      $gte: new Date(`${startDate}T00:00:00`),
      $lte: new Date(`${finalEndDate}T23:59:59`),
    };
  }

  if (categoryIds?.length) {
    query.categoryId = { $in: categoryIds };
  }

  if (descriptions?.length) {
    const safe = descriptions.map((d) =>
      d.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`),
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

  data.forEach((e) => {
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

/* ---------------- GET DATA ---------------- */

exports.getData = async (params) => {
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
  const fantasyName = data.fantasyName?.trim().toUpperCase();

  const computedDate = computeStatementDate(
    data.date,
    data.currentInstallment ?? 1,
  );

  if (fantasyName) {
    await createCategoryInfo({
      fantasyName,
      categoryId: data.categoryId,
      name: data.name ?? '',
      // description: data.description ?? '',
    });
  }

  return DataModel.create({
    date: computedDate,
    fantasyName,
    name: data.name ?? '',
    description: data.description ?? '',
    categoryId: data.categoryId,
    paymentType: data.paymentType ?? null,
    value: toPositiveBRL(data.value),
    currentInstallment: data.currentInstallment ?? 1,
    totalInstallment: data.totalInstallment ?? 1,
  });
}

exports.createData = async (data) => {
  const total = data.totalInstallment ?? 1;

  const docs = [];

  for (let i = 0; i < total; i++) {
    docs.push(
      await insertData({
        ...data,
        currentInstallment: i + 1,
      }),
    );
  }

  return docs;
};

/* ---------------- IMPORT MANY ---------------- */

exports.insertMany = async (rows) => {
  if (!rows?.length) return { inserted: 0, updated: 0 };

  let inserted = 0;
  let updated = 0;

  for (const r of rows) {
    const fantasyName = r.fantasyName?.trim().toUpperCase();
    const total = r.totalInstallment ?? 1;
    const baseInstallment = r.currentInstallment ?? 1;
    const value = toPositiveBRL(r.value);

    if (fantasyName) {
      await createCategoryInfo({
        fantasyName,
        categoryId: r.categoryId,
        name: r.name ?? '',
      });
    }

    // 🔥 Only generate remaining installments
    const remaining = total - baseInstallment + 1;

    for (let i = 0; i < remaining; i++) {
      const currentInstallment = baseInstallment + i;

      const computedDate = computeStatementDate(r.date, currentInstallment);

      const result = await DataModel.updateOne(
        {
          fantasyName,
          date: computedDate,
          value,
          currentInstallment,
        },
        {
          $setOnInsert: {
            date: computedDate,
            fantasyName,
            name: r.name ?? '',
            description: r.description ?? '',
            categoryId: r.categoryId,
            paymentType: r.paymentType ?? null,
            value,
            currentInstallment,
            totalInstallment: total,
          },
        },
        { upsert: true },
      );

      if (result.upsertedCount > 0) inserted++;
      else updated++;
    }
  }

  return { inserted, updated };
};

/* ---------------- CRUD ---------------- */

exports.getByIdData = (id) => DataModel.findOne({ _id: new ObjectId(id) });

exports.updateData = async (id, data) => {
  const updated = await DataModel.findByIdAndUpdate(id, data, { new: true });

  if (updated?.fantasyName) {
    await createCategoryInfo({
      fantasyName: updated.fantasyName,
      categoryId: updated.categoryId,
      name: updated.name ?? '',
      // description: updated.description ?? '',
    });
  }

  return updated;
};

exports.deleteData = (id) => DataModel.findByIdAndDelete(id);

exports.getUniqueDescriptions = async (fantasyName, name) => {
  const query = {};

  if (fantasyName) {
    query.fantasyName = {
      $regex: fantasyName,
      $options: 'i',
    };
  }

  if (name) {
    query.name = {
      $regex: name,
      $options: 'i',
    };
  }

  const descriptions = await DataModel.distinct('description', query);

  return descriptions
    .filter((d) => d && d.trim() !== '')
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
};


