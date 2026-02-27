const categoryInfoModel = require('../models/category.info.model');
const data = require('../models/data.model');
const { getStatementDateFromRow } = require('./installment.helper');

exports.findByCompositeKeys = async (rows) => {
  const conditions = rows.map((r) => {
    const date = new Date(getStatementDateFromRow(r));
    date.setUTCHours(0, 0, 0, 0);

    const fantasyName = r.fantasyName
      ?.replace(/^\d{2}\/\d{2}\s*/, '')
      .trim()
      .toUpperCase();

    return {
      fantasyName,
      date,
      categoryId: r.categoryId,
      value: Number(r.value),
    };
  });

  console.log('DUPLICATE SEARCH CONDITIONS:', conditions);

  return data.find({ $or: conditions }).lean();
};
