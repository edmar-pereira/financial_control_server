// installment.helper.js

function parseDateString(dateStr) {
  if (!dateStr) return null;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return null;

    return new Date(
      Date.UTC(
        dateStr.getUTCFullYear(),
        dateStr.getUTCMonth(),
        dateStr.getUTCDate(),
      ),
    );
  }

  if (typeof dateStr !== 'string') return null;

  // DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(Date.UTC(+year, +month - 1, +day));
  }

  // YYYY-MM-DD
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return new Date(Date.UTC(+year, +month - 1, +day));
  }

  return null;
}

exports.getPurchaseDate = (rowOrDate) => {
  if (!rowOrDate) return null;

  if (typeof rowOrDate === 'string' || rowOrDate instanceof Date) {
    return parseDateString(rowOrDate);
  }

  return parseDateString(rowOrDate.date);
};

exports.computeStatementDate = (purchaseDate, currentInstallment = 1) => {
  const base = parseDateString(purchaseDate);
  if (!base) return null;

  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const day = base.getUTCDate();

  const targetMonth = month + (currentInstallment - 1);

  const firstOfTarget = new Date(Date.UTC(year, targetMonth, 1));

  const lastDay = new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  const safeDay = Math.min(day, lastDay);

  return new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth(),
      safeDay,
    ),
  );
};
