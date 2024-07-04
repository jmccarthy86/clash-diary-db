// /lib/excelUtils.ts

export async function fetchExcelData(userId, documentId, sheetName, range = null, useUsedRange = false) {
  const params = new URLSearchParams({ userId, documentId, sheetName });
  if (range) {
    params.append('range', range);
  }
  if (useUsedRange) {
    params.append('useUsedRange', 'true');
  }

  const response = await fetch(`/api/fetchExcelData?${params.toString()}`);
  const data = await response.json();

  //console.log(data);

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    excelData: data.values,
    usedRange: data.range,
  };
}

export const saveExcelData = async (userId: string, documentId: string, sheetName: string, data: any[], range: string, operation: 'update' | 'create' | 'delete') => {

  const response = await fetch('/api/saveExcelData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      documentId,
      sheetName,
      data,
      range,
      operation
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save Excel data');
  }
  return response.json();
};

export const convertExcelDataToObject = (data, year) => {
  console.log('convertExcelDataToObject data: ', data)
  // Organise provided data
  const { address, values } = data;
  const headers = values[0];
  const rows = values.slice(1);
  const endColumnLetter = address.split('!')[1].split(':')[1].replace(/[0-9]/g, '');
  // console.log(range);
  // console.log(endColumnLetter);

  // Prepare and build our object for return
  const result = { 
    //MonthYear: `${month}:${year}`, 
    Year: year,
    Range: address.split('!')[1].replace(/^'/, ''),
    Dates: {} 
  };

   // Check if the "Date" column exists in the headers, if not we can't continue.
  const dateIndex = headers.indexOf('Date');
  if (dateIndex === -1) {
    console.error("Date column not found");
    return result;
  }

  // Build our {Dates} object
  rows.forEach((row, rowIndex) => {

    // skip the first 2 rows as they are headersSet and totals
    const rowNumber = rowIndex + 2;

    const date = row[1]; // Assuming "Date" is the second column (index 1)
    const rowRange = `A${rowNumber}:${endColumnLetter}${rowNumber}`;
    //console.log(rowRange);
    const rowObject = {};

    row.forEach((cell, cellIndex) => {
      rowObject[headers[cellIndex]] = cell;
    });

    if (!result.Dates[date]) { 
      result.Dates[date] = {};
    }

    result.Dates[date][rowRange] = rowObject;

  });

  return result;
};
  
export const convertObjectToExcelData = (dataObject) => {
  const { Range, Dates } = dataObject;
  const allRows = [];
  const headersSet = new Set();

  // Collect headers dynamically from the data
  Object.keys(Dates).forEach(date => {
    const rows = Dates[date];
    Object.keys(rows).forEach(rowRange => {
      const row = rows[rowRange];
      Object.keys(row).forEach(cellKey => {
        const cell = row[cellKey];
        const header = Object.keys(cell)[0];
        if (header && header.trim() !== '' && header !== null) {
          headersSet.add(header);
        }
      });
    });
  });

  const headers = Array.from(headersSet);

  Object.keys(Dates).forEach(date => {
    const rows = Dates[date];
    Object.keys(rows).forEach(rowRange => {
      const row = rows[rowRange];
      const rowArray = headers.map(header => {
        const cell = Object.values(row).find(cell => Object.keys(cell)[0] === header);
        return cell ? cell[header] : '';
      });
      allRows.push(rowArray);
    });
  });

  return { range: Range, values: [headers, ...allRows] };

};

export const convertFormDataToExcelObject = (data ) => {

  const headers = ["Day", "Date", "P", "Venue", "OtherVenue", "VenueIsTba", "TitleOfShow", "ShowTitleIsTba", "Producer", "PressContact", "DateBkd", "UserId", "IsSeasonGala", "IsOperaDance"];

  let rows: any[] = [];

  headers.forEach( header => {
    rows.push( ( data[header] ? data[header] : 'N/A' )  );
  });

  return rows;

};

// export const convertFormDataToExcelObject = (data) => {

//   const headers = ["Day", "Date", "P", "Venue", "OtherVenue", "VenueIsTba", "TitleOfShow", "ShowTitleIsTba", "Producer", "PressContact", "DateBkd", "UserId", "IsSeasonGala", "isOperaDance"];

//   const date = new Date(data.DATE);
//   const formattedDate = date.toISOString().split('T')[0];
//   const rowRange = `A${date.getDate() + 1}:H${date.getDate() + 1}`;
//   const rowObject = {};

//   rowObject[`A${date.getDate() + 1}`] = { "DAY": data.DAY };
//   rowObject[`B${date.getDate() + 1}`] = { "DATE": date.getDate() };
//   rowObject[`C${date.getDate() + 1}`] = { "P": data.P ? "P" : "" };
//   rowObject[`D${date.getDate() + 1}`] = { "VENUE": data.VENUE };
//   rowObject[`E${date.getDate() + 1}`] = { "TITLE OF SHOW": data["TITLE OF SHOW"] };
//   rowObject[`F${date.getDate() + 1}`] = { "PRODUCER": data.PRODUCER };
//   rowObject[`G${date.getDate() + 1}`] = { "PRESS CONTACT": data["PRESS CONTACT"] };
//   rowObject[`H${date.getDate() + 1}`] = { "DATE BKD": "" }; // Add this field if required

//   return {
//     MonthYear: `${date.getMonth() + 1}:${date.getFullYear()}`,
//     Range: `'${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().slice(-2)}'!A1:H100`,
//     Dates: {
//       [formattedDate]: {
//         [rowRange]: rowObject
//       }
//     }
//   };
// };

export const addNewRow = (dataObject, date, newRowData) => {
  // Check if the date exists in the dataObject
  if (!dataObject.Dates[date]) {
      dataObject.Dates[date] = {};
  }

  // Determine the next available row number
  const dateRows = Object.keys(dataObject.Dates[date]);
  const highestRowNumber = dateRows.length > 0 
      ? Math.max(...dateRows.map(rowRange => parseInt(rowRange.match(/\d+/)[0]))) 
      : 1; // Start from row 1 if no rows exist for the date

  const newRowNumber = highestRowNumber + 1;
  const newRowRange = `A${newRowNumber}:H${newRowNumber}`;

  // Add the new row
  dataObject.Dates[date][newRowRange] = {};

  // Populate the new row with the provided data
  Object.keys(newRowData).forEach((colLetter, index) => {
      const cellAddress = `${colLetter}${newRowNumber}`;
      dataObject.Dates[date][newRowRange][cellAddress] = newRowData[colLetter];
  });

  return dataObject;
};

const convertDateFormat = (dateString) => {
  const parts = dateString.split('/');
  if (parts.length !== 3) {
      console.warn(`Invalid date format: ${dateString}`); // Debugging
      return null;
  }
  const [day, month, year] = parts;
  return `${month}/${day}/${year}`;
};