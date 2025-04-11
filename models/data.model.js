const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  description: String,
  ignore: {
    type: Boolean,
    default: false,
  },
  categoryId: String,
  value: Number,
  currentInstallment: Number,
  totalInstallment: Number,
});

module.exports = mongoose.model('data', schema);
