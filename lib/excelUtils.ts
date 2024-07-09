// /lib/excelUtils.ts
import { headers } from '@/lib/config'
import { RequestData } from '@/lib/types'

export async function fetchExcelData(userId: string, documentId: string, sheetName: string, range = null, useUsedRange = false) {
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

export const convertExcelDataToObject = (data: any, year: string): RequestData => {
	console.log('convertExcelDataToObject data: ', data);

	// Organize provided data
	const { address, values } = data;
	const headers = values[0];
	const rows = values.slice(1);
	const endColumnLetter = address.split('!')[1].split(':')[1].replace(/[0-9]/g, '');

	// Prepare and build our object for return
	const result: RequestData = {
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
	rows.forEach((row: string[], rowIndex: number) => {
		// Skip the first 2 rows as they are headersSet and totals
		const rowNumber = rowIndex + 2;

		const date = row[dateIndex];
		const rowRange = `A${rowNumber}:${endColumnLetter}${rowNumber}`;
		const rowObject: Record<string, string> = {};

		row.forEach((cell, cellIndex) => {
			rowObject[headers[cellIndex]] = cell;
		});

		if (!result.Dates[date]) {
			result.Dates[date] = {
				range: rowRange,
				bookings: []
			};
		}

		result.Dates[date].bookings.push(rowObject);
	});

	return result;
};

export const convertObjectToExcelData = (dataObject: any) => {
	const { Range, Dates } = dataObject;
	const allRows: string[][] = [];
	const headersSet = new Set<string>();

	// Define the type for row
	type RowType = Record<string, string>;

	// Collect headers dynamically from the data
	Object.keys(Dates).forEach(date => {
		const rows: RowType[] = Dates[date].bookings;
		rows.forEach((row: RowType) => {
			Object.keys(row).forEach(header => {
				if (header && header.trim() !== '' && header !== null) {
					headersSet.add(header);
				}
			});
		});
	});

	const headers = Array.from(headersSet);

	Object.keys(Dates).forEach(date => {
		const rows = Dates[date].bookings;
		rows.forEach((row: RowType) => {
			const rowArray = headers.map(header => {
				return row[header] || '';
			});
			allRows.push(rowArray);
		});
	});

	return { range: Range, values: [headers, ...allRows] };
};


export const convertFormDataToExcelObject = (data: any) => {

	const headers = ["Day", "Date", "P", "Venue", "OtherVenue", "VenueIsTba", "TitleOfShow", "ShowTitleIsTba", "Producer", "PressContact", "DateBkd", "IsSeasonGala", "IsOperaDance", "UserId"];

	let rows: any[] = [];

	headers.forEach(header => {
		rows.push((data[header] ? data[header] : 'N/A'));
	});

	return rows;

};

// export const addNewRow = (dataObject: any, date: string, newRowData: []) => {
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