const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  label: { type: String, required: true, trim: true },
  color: { type: String, trim: true },
  maxValue: { type: Number, default: 0, min: 0 },
});

module.exports = mongoose.model('category', schema);