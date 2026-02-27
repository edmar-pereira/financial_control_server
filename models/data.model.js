const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },

    fantasyName: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    name: {
      type: String,
      trim: true,
      default: '',
    },

    description: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },

    categoryId: {
      type: String,
      required: true,
      default: 'uncategorized',
      index: true,
    },

    paymentType: {
      type: String,
      default: null,
    },

    value: {
      type: Number,
      required: true,
      index: true,
    },

    currentInstallment: {
      type: Number,
      default: 1,
      min: 1,
    },

    totalInstallment: {
      type: Number,
      default: 1,
      min: 1,
    },

    ignore: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * ✅ Composite index to HELP duplicate detection
 * (not unique on purpose — validation happens in service layer)
 */
schema.index({
  fantasyName: 1,
  date: 1,
  value: 1,
});

module.exports = mongoose.model('data', schema);
