const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema(
  {
    purchaseId: {
      type: String,
      index: true,
      default: null, // registros antigos continuam válidos
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

    statementDate: Date,

    ignore: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Impede parcela duplicada dentro da mesma compra.
// O filtro parcial ignora registros antigos sem purchaseId.

schema.index(
  { purchaseId: 1, currentInstallment: 1 },
  {
    unique: true,
    partialFilterExpression: { purchaseId: { $type: 'string' } },
  },
);

module.exports = mongoose.model('data', schema);