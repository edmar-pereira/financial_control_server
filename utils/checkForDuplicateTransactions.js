const Transaction = require('../models/data.model');

/* -------------------------------------------------
   NORMALIZE DATE
-------------------------------------------------- */
const normalizeDateForKey = (date) => {
  if (!date) {
    return '';
  }

  try {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return '';
    }

    return d.toISOString().slice(0, 10);
  } catch (err) {
    return '';
  }
};

/* -------------------------------------------------
   NORMALIZE FANTASY NAME
-------------------------------------------------- */
const normalizeFantasyName = (text = '') => {
  return String(text)
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
};

/* -------------------------------------------------
   NORMALIZE VALUE
-------------------------------------------------- */
const normalizeValue = (value = 0) => {
  return Number(Number(value).toFixed(2));
};

/* -------------------------------------------------
   CREATE UNIQUE KEY
-------------------------------------------------- */
const createKey = (transaction) => {
  return [
    normalizeFantasyName(transaction.fantasyName),

    normalizeDateForKey(transaction.date),

    normalizeValue(transaction.value),

    Number(transaction.currentInstallment || 1),

    Number(transaction.totalInstallment || 1),
  ].join('|');
};

/* -------------------------------------------------
   CHECK DUPLICATES
-------------------------------------------------- */
const checkForDuplicateTransactions = async (transactions = []) => {
  if (!transactions.length) {
    return [];
  }

  /* -----------------------------------------
       GET DATE RANGE
    ----------------------------------------- */

  const validDates = transactions
    .map((t) => new Date(t.date))
    .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()));

  if (!validDates.length) {
    return transactions.map((transaction) => ({
      ...transaction,
      duplicated: false,
    }));
  }

  const minDate = new Date(Math.min(...validDates.map((d) => d.getTime())));

  const maxDate = new Date(Math.max(...validDates.map((d) => d.getTime())));

  /* -----------------------------------------
       LOAD EXISTING TRANSACTIONS
    ----------------------------------------- */

  const existingTransactions = await Transaction.find({
    date: {
      $gte: minDate,
      $lte: maxDate,
    },
  }).lean();

  /* -----------------------------------------
       CREATE LOOKUP SET
    ----------------------------------------- */

  const existingSet = new Set(
    existingTransactions.map((transaction) => createKey(transaction)),
  );

  /* -----------------------------------------
       DEBUG
    ----------------------------------------- */

  // console.log('\n========== EXISTING ==========\n');

  // existingSet.forEach((key) => console.log(key));

  // console.log('\n========== IMPORT ==========\n');

  // transactions.forEach((transaction) => {
  //   const key = createKey(transaction);

  //   console.log({
  //     key,
  //     duplicated: existingSet.has(key),
  //   });
  // });

  /* -----------------------------------------
       MARK DUPLICATES
    ----------------------------------------- */

  return transactions.map((transaction) => {
    const key = createKey(transaction);

    return {
      ...transaction,
      duplicated: existingSet.has(key),
    };
  });
};

module.exports = {
  checkForDuplicateTransactions,
};
