const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    fantasyName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },

    companyName: {
      type: String,
      default: '',
    },

    categoryId: {
      type: String,
      required: true,
    },

    source: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('categoryInfo', schema);
