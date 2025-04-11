const service = require('../services/category.info.service');
const XLSX = require('xlsx');

function formatDateHeader(param) {
  const [day, month, year] = param.split('/');
  let transactionDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return transactionDate;
}

function toPositiveBRL(value) {
  if (typeof value !== 'string') return 0;
  if (value.includes(',')) {
    value = value.replace(/\./g, '').replace(',', '.');
  }
  let numericValue = parseFloat(value);
  return isNaN(numericValue) ? 0 : Math.abs(numericValue);
}

function parseTransaction(input) {
  const parts = input.split(/\s{2,}/);
  const expType = parts[0].trim();
  const rest = parts[1].trim();

  // Step 2: Extract date (matches DD/MM format)
  const dateMatch = rest.match(/(\d{2})\/(\d{2})/);

  let dateISO = null;
  let exp = rest;

  if (dateMatch) {
    const day = dateMatch[1];
    const month = dateMatch[2];

    // Step 3: Build ISO date (Assuming current year, or you can customize)
    const year = new Date().getFullYear();
    const dateObj = new Date(`${year}-${month}-${day}`);
    dateISO = dateObj.toISOString();

    // Step 4: Remove date part from rest to get exp
    exp = rest.replace(dateMatch[0], '').trim();
  }

  return {
    expType,
    date: dateISO,
    exp,
  };
}

function AcceptThisPattern(numberToTest) {
  if (typeof numberToTest !== 'string') {
    return false; // Only strings allowed
  }

  const trimmedValue = numberToTest.trim();

  // Check if exactly 6 numeric digits (accepts 000000)
  if (/^[0-9]{6}$/.test(trimmedValue)) {
    // Return as number (removes leading zeros, so '000000' becomes 0)
    return true;
  }

  return false; // Invalid case
}

// Function to handle file upload and processing
const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    const data = await service.getCategoryInfo();

    function machValues(valueToMatch) {
      const filteredData = data.filter(
        (item) => item.fantasyName === valueToMatch
      );

      if (filteredData.length > 0) {
        return {
          type: filteredData[0].categoryId,
          description: filteredData[0].description,
        };
      } else {
        return { type: 'uncategorized', description: '' };
      }
    }

    const workbook = XLSX.read(req.file.buffer, {
      importedEntryType: 'buffer',
    });
    const sheetName = workbook.SheetNames[0];
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const formattedData = jsonData.map((row) => {
      let numberToTest = AcceptThisPattern(row['__EMPTY_1']);

      if (numberToTest === true) {
        const mainType = row['__EMPTY'] === undefined ? '' : row['__EMPTY'];

        let transactionDate = '';
        let fantasyName = '';
        let importedEntryType = '';
        let type = '';
        let description = '';
        let value = 0;

        if (mainType.includes('PIX ENVIADO')) {
          const splited = row['__EMPTY'].split(/\s{2,}/);
          const matchedValues = machValues(splited[1]?.trim());

          transactionDate = formatDateHeader(
            row['EXTRATO DE CONTA CORRENTE '].trim()
          );
          fantasyName = splited[1]?.trim();
          importedEntryType = splited[0].trim();
          type = matchedValues.type;
          description = matchedValues.description;
          value = toPositiveBRL(row['__EMPTY_4']);
        } else if (
          mainType.includes('PIX RECEBIDO') ||
          mainType.includes('LIQUIDO DE VENCIMENTO')
        ) {
          const splited = row['__EMPTY'].split(/\s{2,}/);
          const matchedValues = machValues(splited[1]?.trim());
          transactionDate = formatDateHeader(
            row['EXTRATO DE CONTA CORRENTE '].trim()
          );
          fantasyName = splited[1].trim();
          importedEntryType = splited[0].trim();
          type = matchedValues.type;
          description = matchedValues.description;
          value = toPositiveBRL(row['__EMPTY_3']);
        } else if (mainType.includes('DEBITO VISA ELECTRON BRASIL')) {
          const val = parseTransaction(row['__EMPTY']);
          const matchedValues = machValues(val.exp);
          transactionDate = val.date;
          fantasyName = val.exp;
          importedEntryType = val.expType;
          type = matchedValues.type;
          description = matchedValues.description;
          value = toPositiveBRL(row['__EMPTY_4']);
        } else {
          transactionDate = formatDateHeader(
            row['EXTRATO DE CONTA CORRENTE '].trim()
          );
          const splited = row['__EMPTY'].split(/\s{2,}/);
          if (splited.length === 1) {
            type = 'uncategorized';
            description = '';
            fantasyName = splited[0].trim();
            importedEntryType = splited[0].trim();
            value = toPositiveBRL(row['__EMPTY_4']);
          } else {
            const matchedValues = machValues(splited[1].trim());
            type = matchedValues.type;
            description = matchedValues.description;
            fantasyName = splited[1].trim();
            importedEntryType = splited[0].trim();
            value = toPositiveBRL(row['__EMPTY_4']);
          }
        }

        return {
          date: transactionDate,
          fantasyName,
          importedEntryType,
          type,
          description,
          value,
        };
      }

      return null; // Return null if invalid
    });

    // Filter out null or undefined entries from the array
    const extractedObj = formattedData.filter(
      (entry) => entry !== null && entry !== undefined
    );

    res
      .status(200)
      .json({ message: 'Data uploaded successfully', data: extractedObj });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file.');
  }
};

module.exports = { uploadFile };
