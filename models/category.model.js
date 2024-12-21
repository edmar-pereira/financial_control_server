const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  id: String,
  label: String,
  color: String,
  maxValue: Number,
});

module.exports = mongoose.model('category', schema);
