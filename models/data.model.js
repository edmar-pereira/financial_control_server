const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema(
  {
    purchaseId: {
      type: String,
      required: true,
      index: true,
    },

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
    statementDate: {
      type: Date,
    },

    ignore: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/* 🔥 GARANTE QUE NUNCA DUPLICA */
schema.index({ purchaseId: 1, currentInstallment: 1 }, { unique: true });

module.exports = mongoose.model('data', schema);
