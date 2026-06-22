const crypto = require('crypto');
const DataModel = require('../models/data.model');
const { ObjectId } = require('mongodb');
const { createCategoryInfo } = require('./category.info.service');

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
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);

    const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));

    let endExclusive;

    if (endDate) {
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

      // primeiro instante do dia seguinte
      endExclusive = new Date(Date.UTC(endYear, endMonth - 1, endDay + 1));
    } else {
      // primeiro dia do próximo mês
      endExclusive = new Date(Date.UTC(startYear, startMonth, 1));
    }

    query.date = {
      $gte: start,
      $lt: endExclusive,
    };

  }

  if (categoryIds?.length) {
    query.categoryId = {
      $in: Array.isArray(categoryIds) ? categoryIds : [categoryIds],
    };
  }

  if (descriptions?.length) {
    const safeDescriptions = descriptions.map((d) =>
      d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );

    query.description = {
      $regex: safeDescriptions.join('|'),
      $options: 'i',
    };
  }

  if (valuesRange && (valuesRange.min != null || valuesRange.max != null)) {
    query.value = {};

    if (valuesRange.min != null) {
      query.value.$gte = Number(valuesRange.min);
    }

    if (valuesRange.max != null) {
      query.value.$lte = Number(valuesRange.max);
    }
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

  // const computedDate = computeStatementDate(
  //   data.date,
  //   data.currentInstallment ?? 1,
  // );

  // const computedDate = '';

  if (fantasyName) {
    await createCategoryInfo({
      fantasyName,
      categoryId: data.categoryId,
      companyName: data.name ?? '',
      // description: data.description ?? '',
    });
  }

  return DataModel.create({
    date: data.date,
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

  console.log(data)

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
  if (!rows?.length) return { msg: 'Sem dados para importar' };

  // console.log(JSON.stringify(rows, null, 2));

  let inserted = 0;
  let updated = 0;

  for (const r of rows) {
    const fantasyName = r.fantasyName?.trim().toUpperCase();
    const total = r.totalInstallment ?? 1;
    const currentInstallment = r.currentInstallment ?? 1;
    const value = toPositiveBRL(r.value);

    if (!fantasyName || !r.date) continue;

    /* 🔑 ID ÚNICO DA COMPRA */
    // const purchaseId = crypto
    //   .createHash('md5')
    //   .update(`${fantasyName}_${r.date}_${value}_${total}_${r.name ?? ''}`)
    //   .digest('hex');

    /* 🔄 GARANTE CATEGORY */
    await createCategoryInfo({
      fantasyName,
      categoryId: r.categoryId,
      companyName: r.name ?? '',
    });

    const result = await DataModel.updateOne(
      {
        // purchaseId,
        currentInstallment,
      },
      {
        $setOnInsert: {
          // purchaseId,
          date: r.date,
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
      companyName: updated.name ?? '',
      // description: updated.description ?? '',
    });
  }

  return updated;
};

exports.deleteData = (id) => DataModel.findByIdAndDelete(id);

exports.getUniqueDescriptions = async (description) => {
  const query = {};

  if (description) {
    query.description = {
      $regex: description,
      $options: 'i',
    };
  }

  const descriptions = await DataModel.distinct('description', query);

  return descriptions
    .filter((d) => d && d.trim() !== '')
    .sort((a, b) =>
      a.localeCompare(b, 'pt-BR', {
        sensitivity: 'base',
      }),
    );
};
