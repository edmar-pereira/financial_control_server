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
  type: String,
  avatarType: String,
  value: Number,
  month: String,
  year: String,
  installments: String,
});

module.exports = mongoose.model('data', schema);
