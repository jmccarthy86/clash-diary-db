// /lib/excelUtils.ts
import { headers } from "@/lib/config";
import { RequestData } from "@/lib/types";
import { processDate } from "@/lib/utils";

// Define types for the input parameters
interface ExcelData {
    address: string;
    values: any[][]; // 2D array to represent Excel data
}

// Define a flexible type for row data
interface RowData {
    [key: string]: string | number | boolean | null;
}

// Define the structure of the result
type Result = RequestData;

export const convertExcelDataToObject = (data: ExcelData, year: string): Result => {
    // Organise provided data
    const { address, values } = data;
    const colHeaders = headers; // headers imported in file
    const rows = values.slice(1); // remove the first row as it holds headers
    const endColumnLetter = address.split("!")[1].split(":")[1].replace(/[0-9]/g, "");

    // Prepare and build our object for return
    const result: Result = {
        Year: year,
        Range: address.split("!")[1].replace(/^'/, ""),
        Dates: {},
    };

    // Check if the "Date" column exists in the headers, if not we can't continue.
    const dateIndex = colHeaders.indexOf("Date");
    if (dateIndex === -1) {
        console.error("Date column not found");
        return result;
    }

    // Build our {Dates} object
    rows.forEach((row, rowIndex) => {
        const rowNumber = rowIndex + 2;

        const date = processDate(row[dateIndex]) as string; // Use dateIndex instead of hardcoding 1
        //const date = row[dateIndex] as string;
        //console.log(row[dateIndex]);
        //console.log(date);
        const rowRange = `A${rowNumber}:${endColumnLetter}${rowNumber}`;

        const rowObject: RowData = {};

        row.forEach((cell, cellIndex) => {
            if (cellIndex === 1 || cellIndex === 13 || cellIndex === 16) {
                rowObject[colHeaders[cellIndex]] = processDate(cell);
            } else {
                rowObject[colHeaders[cellIndex]] = cell;
            }
        });

        if (!result.Dates[date]) {
            result.Dates[date] = {};
        }

        result.Dates[date][rowRange] = rowObject;
    });

    //console.log(result);

    return result;
};
// 	console.log(dataObject)
// 	const { Range, Dates } = dataObject;
// 	const allRows = [];
// 	const headersSet = new Set();

// 	// Collect headers dynamically from the data
// 	Object.keys(Dates).forEach(date => {
// 		const rows = Dates[date];
// 		Object.keys(rows).forEach(rowRange => {
// 			const row = rows[rowRange];
// 			Object.keys(row).forEach(cellKey => {
// 				const cell = row[cellKey];
// 				const header = Object.keys(cell)[0];
// 				if (header && header.trim() !== '' && header !== null) {
// 					headersSet.add(header);
// 				}
// 			});
// 		});
// 	});

// 	const headers = Array.from(headersSet);

// 	Object.keys(Dates).forEach(date => {
// 		const rows = Dates[date];
// 		Object.keys(rows).forEach(rowRange => {
// 			const row = rows[rowRange];
// 			const rowArray = headers.map(header => {
// 				const cell = Object.values(row).find(cell => Object.keys(cell)[0] === header);
// 				return cell ? cell[header] : '';
// 			});
// 			allRows.push(rowArray);
// 		});
// 	});

// 	return { range: Range, values: [headers, ...allRows] };

// };

// export const convertFormDataToExcelObject = (data) => {

// 	const headers = ["Day", "Date", "P", "Venue", "OtherVenue", "VenueIsTba", "TitleOfShow", "ShowTitleIsTba", "Producer", "PressContact", "DateBkd", "IsSeasonGala", "IsOperaDance", "UserId"];

// 	let rows: any[] = [];

// 	headers.forEach(header => {
// 		rows.push((data[header] ? data[header] : 'N/A'));
// 	});

// 	return rows;

// };

// export const addNewRow = (dataObject, date, newRowData) => {
// 	// Check if the date exists in the dataObject
// 	if (!dataObject.Dates[date]) {
// 		dataObject.Dates[date] = {};
// 	}

// 	// Determine the next available row number
// 	const dateRows = Object.keys(dataObject.Dates[date]);
// 	const highestRowNumber = dateRows.length > 0
// 		? Math.max(...dateRows.map(rowRange => parseInt(rowRange.match(/\d+/)[0])))
// 		: 1; // Start from row 1 if no rows exist for the date

// 	const newRowNumber = highestRowNumber + 1;
// 	const newRowRange = `A${newRowNumber}:H${newRowNumber}`;

// 	// Add the new row
// 	dataObject.Dates[date][newRowRange] = {};

// 	// Populate the new row with the provided data
// 	Object.keys(newRowData).forEach((colLetter, index) => {
// 		const cellAddress = `${colLetter}${newRowNumber}`;
// 		dataObject.Dates[date][newRowRange][cellAddress] = newRowData[colLetter];
// 	});

// 	return dataObject;
// };

// const convertDateFormat = (dateString) => {
// 	const parts = dateString.split('/');
// 	if (parts.length !== 3) {
// 		console.warn(`Invalid date format: ${dateString}`); // Debugging
// 		return null;
// 	}
// 	const [day, month, year] = parts;
// 	return `${month}/${day}/${year}`;
// };
