import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Booking, RequestData, SubRowData } from "@/lib/types"
import { format } from 'date-fns'
import { headers } from '@/lib/config'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Function to get GMT date in {day} {month} {year} format using Intl.DateTimeFormat
export function getGMTDateFormatted(date: Date | undefined): string {

	if (!date) return '';

	// Options for formatting the date
	const options: Intl.DateTimeFormatOptions = {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		//timeZone: 'UTC'
	};

	//console.log('date: ' + date);

	// Format the date
	const formatter = new Intl.DateTimeFormat('en-GB', options);
	return formatter.format(date);
}

// Function to get GMT date in {day} {month} {year} format using Intl.DateTimeFormat
export function getGMTDateFormattedDayOfTheMonth(date: Date | undefined): string {

	if (!date) return '';

	// Replacing the options to return only the date of the month as a string
	const options: Intl.DateTimeFormatOptions = {
		day: 'numeric',
	};

	console.log('date: ' + date);

	// Format the date
	const formatter = new Intl.DateTimeFormat('en-GB', options);
	return formatter.format(date);
}

export function transformData(inputData: RequestData): Booking[] {
	const result: Booking[] = [];

	for (const [date, entries] of Object.entries(inputData.Dates)) {
		const booking: Booking = {
			date,
			subRows: []
		};

		for (const [range, data] of Object.entries(entries)) {
			const subRow: SubRowData = {
				range,
				...data
			};
			booking.subRows.push(subRow);
		}

		result.push(booking);
	}

	return result.sort((a, b) => {
		const dateA = a.date.split('/').reverse().join('-');
		const dateB = b.date.split('/').reverse().join('-');
		return new Date(dateA).getTime() - new Date(dateB).getTime();
	});
}

export function parseDate(dateString: string): Date {
	const [day, month, year] = dateString.split('/').map(Number);
	return new Date(year, month - 1, day); // month is 0-indexed in JS Date
}

export function unCamelCase(str: string) {
	return str
		// Insert a space before all caps
		.replace(/([A-Z])/g, ' $1')
		// Uppercase the first character
		.replace(/^./, function (str) { return str.toUpperCase(); })
		// Trim any leading spaces
		.trim();
}

export function convertToDate(dateString: string): Date | null {
	const date = new Date(dateString.split('/').reverse().join('-'));
	return isNaN(date.getTime()) ? null : date;
}

// // This type should match RequestData
// export type YearCalendarData = RequestData;

type DateEntry = {
	[range: string]: {
		[key: string]: string | number | boolean | null;
	};
};

export function createYearCalendarWithData(year: number, existingData: RequestData['Dates']): RequestData['Dates'] {
	const yearCalendar: RequestData['Dates'] = {};
	const startDate = new Date(year, 0, 1);  // January 1st of the given year
	const endDate = new Date(year, 11, 31);  // December 31st of the given year

	for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
		const dateString = formatDate(d);
		yearCalendar[dateString] = existingData[dateString] || {};
	}

	return yearCalendar;
}

function formatDate(date: Date): string {
	const day = date.getDate().toString().padStart(2, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const year = date.getFullYear();
	return `${day}/${month}/${year}`;
}

export function prepareBookingFormData(data: any) {
	return Object.values(Object.fromEntries(
		headers.map((key) => {
			if (key === "Date" && data[key] instanceof Date) {
				return [key, format(data[key], "dd/MM/yyyy")]; // Use your desired format here
			}
			return [key, data[key]];
		})
	));
}