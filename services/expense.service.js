const data = require('../models/data.model');

exports.findByCompositeKeys = async (rows) => {
  return data.find({
    $or: rows.map(r => ({
      fantasyName: r.fantasyName,
      date: {
        $gte: new Date(r.date + 'T00:00:00.000Z'),
        $lte: new Date(r.date + 'T23:59:59.999Z'),
      },
      value: Number(r.value),
    })),
  }).lean();
};