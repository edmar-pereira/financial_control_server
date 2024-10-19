const moment = require('moment');
const service = require('../models/data.model');

async function filterAll(data, month, year) {
  let totalRev = 0;
  let totalExp = 0;

  data.map((e) => {
    if (e.type === 'Receita' && e.ignore === false) {
      totalRev += e.value;
    } else if (e.ignore === false && e.type !== 'Investimentos') {
      totalExp += e.value;
    }
  });

  let currentMonthFilteredSorted = await data.sort((a, b) => {
    return moment(a.date).diff(b.date);
  });

  currentMonthFilteredSorted = currentMonthFilteredSorted.reverse();

  const obj = {
    expenses: currentMonthFilteredSorted,
    totalRev,
    totalExp,
    difference: totalRev - totalExp,
    month,
    year,
  };

  return obj;
}

exports.getData = async (params) => {
  const { month, year, category } = params;
  let query = {};

  if (month !== undefined) {
    query.month = month;
  }
  if (year !== undefined) {
    query.year = year;
  }
  if (category !== undefined) {
    query.avatarType = category;
  }

  const data = await service.find(query);

  const values = await filterAll(data, month, year);

  return values;
};

exports.getMonths = async () => {
  let arr = [];

  let currMonthDesc = new Date().toLocaleString('pt-BR', { month: 'long' });
  currMonthDesc =
    currMonthDesc.charAt(0).toUpperCase() + currMonthDesc.slice(1).toString();
  const currYear = new Date().toISOString().split('-');
  let currMonth = currMonthDesc + ' - ' + currYear[0];

  const data = await service.find();
  data.map((e, index) => {
    let monthDesc = new Date(e.date).toLocaleString('pt-BR', { month: 'long' });
    monthDesc =
      monthDesc.charAt(0).toUpperCase() + monthDesc.slice(1).toString();
    const year = new Date(e.date).toISOString().split('-')[0];
    if (!arr.includes(monthDesc + ' - ' + year)) {
      arr.push(monthDesc + ' - ' + year);
    }
  });
  if (!arr.includes(currMonth)) {
    arr.push(currMonth);
  }
  arr.reverse();
  return arr;
};

exports.createData = async (data) => {
  try {
    if (data.installment === 1) {
      console.log(data);
      return await service.create(data);
    } else {
      for (let index = 0; index < data.installment; index++) {
        let date = new Date(data.date);
        date.setMonth(date.getMonth() + index);

        const shortDate = new Date(date).toISOString().substring(0, 10);
        const obj = shortDate.split('-');
        const dateFormated = new Date(obj[0], obj[1] - 1, obj[2]); // 2009-11-10
        const dateConverted = dateFormated.toLocaleString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const splitedDate = dateConverted.split(' ');
        await service.create({
          date,
          description: data.description,
          ignore: false,
          type: data.type,
          avatarType: data.avatarType,
          installments: data.installments,
          value: data.value,
          year: splitedDate[4],
          month:
            splitedDate[2].charAt(0).toUpperCase() +
            splitedDate[2].slice(1).toString(),
          installments: `Parcela ${index + 1} de ${data.installment}`,
        });
        // console.log({
        //   date,
        //   description: data.description,
        //   ignore: false,
        //   type: data.type,
        //   avatarType: data.avatarType,
        //   value: data.value,
        //   installment: `Parcela ${index + 1} de ${data.installment}`,
        //   year: splitedDate[4],
        //   month:
        //     splitedDate[2].charAt(0).toUpperCase() +
        //     splitedDate[2].slice(1).toString(),
        // });
      }
    }
  } catch (e) {
    console.log(e);
  }

  // return await service.create(data);
};

exports.getByIdData = async (id) => {
  return await service.findById(id);
};

exports.updateData = async (id, data) => {
  console.log(id, data);
  return await service.findByIdAndUpdate(id, data);
};

exports.deleteData = async (id) => {
  return await service.findByIdAndDelete(id);
};

