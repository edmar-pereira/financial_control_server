const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: String,
  password: String,
});

module.exports = mongoose.model('User', schema);
