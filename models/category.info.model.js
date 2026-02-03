const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  fantasyName: String,
  description: String,
  categoryId: String,
  source: String,
  createdAt: Date,
});

module.exports = mongoose.model('categoryInfo', schema);
