const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  spreadSheetDesc: String,
  description: String,
  type: String,
});

module.exports = mongoose.model('categoryInfo', schema);
