import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Booking, RequestData, SubRowData } from "@/lib/types";
import { format, parseISO, isWithinInterval, parse } from "date-fns";
import { headers } from "@/lib/config";
import { sendEmail } from "./emailService";
import { EmailSender } from "@/lib/types";
import { FieldValues } from "react-hook-form";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Function to get GMT date in {day} {month} {year} format using Intl.DateTimeFormat
export function getGMTDateFormatted(date: Date | undefined): string {
    if (!date) return "";

    // Options for formatting the date
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
        //timeZone: 'UTC'
    };

    ////console.log('date: ' + date);

    // Format the date
    const formatter = new Intl.DateTimeFormat("en-GB", options);
    return formatter.format(date);
}

// Function to get GMT date in {day} {month} {year} format using Intl.DateTimeFormat
export function getGMTDateFormattedDayOfTheMonth(date: Date | undefined): string {
    if (!date) return "";

    // Replacing the options to return only the date of the month as a string
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
    };

    //console.log('date: ' + date);

    // Format the date
    const formatter = new Intl.DateTimeFormat("en-GB", options);
    return formatter.format(date);
}

export function transformData(inputData: RequestData): Booking[] {
    const result: Booking[] = [];

    for (const [date, entries] of Object.entries(inputData.Dates)) {
        const booking: Booking = {
            date,
            subRows: [],
        };

        for (const [range, data] of Object.entries(entries)) {
            //console.log(data);
            // Define the default values for missing fields

            // Ensure data is cast to Partial<SubRowData> and provide defaults for missing fields
            const subRow: SubRowData = {
                Date: (data.Date as string) || "",
                range,
                TitleOfShow: (data.TitleOfShow as string) || "",
                Venue: (data.Venue as string) || "",
                PressContact: (data.PressContact as string) || "",
                IsOperaDance:
                    data.IsOperaDance !== undefined ? (data.IsOperaDance as boolean) : false,
                IsSeasonGala:
                    data.IsSeasonGala !== undefined ? (data.IsSeasonGala as boolean) : false,
                OtherVenue: (data.OtherVenue as string) || "",
                P: data.P !== undefined ? (data.P as boolean) : false,
                UserId: (data.UserId as string) || "",
                ...data,
            };

            booking.subRows.push(subRow);
        }

        result.push(booking);
    }

    return result.sort((a, b) => {
        const dateA = a.date.split("/").reverse().join("-");
        const dateB = b.date.split("/").reverse().join("-");
        return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
}

export function parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split("/").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
}

export function unCamelCase(str: string) {
    return (
        str
            // Insert a space before all caps
            .replace(/([A-Z])/g, " $1")
            // Uppercase the first character
            .replace(/^./, function (str) {
                return str.toUpperCase();
            })
            // Trim any leading spaces
            .trim()
    );
}

export function convertToDate(dateString: string): Date | null {
    const date = new Date(dateString.split("/").reverse().join("-"));
    return isNaN(date.getTime()) ? null : date;
}

export function createYearCalendarWithData(
    year: number,
    existingData: RequestData["Dates"]
): RequestData["Dates"] {
    const yearCalendar: RequestData["Dates"] = {};
    const startDate = new Date(year, 0, 1); // January 1st of the given year
    const endDate = new Date(year, 11, 31); // December 31st of the given year

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateString = formatDate(d);
        yearCalendar[dateString] = existingData[dateString] || {};
    }

    return yearCalendar;
}

function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function prepareBookingFormData(data: any) {
    return Object.values(
        Object.fromEntries(
            headers.map((key) => {
                if (key === "Date" && data[key] instanceof Date) {
                    return [key, format(data[key], "dd/MM/yyyy")]; // Use your desired format here
                }
                return [key, data[key]];
            })
        )
    );
}

export async function handleClashEmails(
    yearData: RequestData,
    currentSelectedDate: Date,
    newData: FieldValues
) {
    const dateString = format(currentSelectedDate, "dd/MM/yyyy");
    const dateEntries = yearData.Dates[dateString];

    if (dateEntries) {
        const emails: string[] = [];

        // Add the new entry's email
        if (newData.PressContact) {
            emails.push(newData.PressContact as string);
        }

        // Add emails from existing entries
        Object.values(dateEntries).forEach((entry) => {
            if (entry.PressContact) {
                emails.push(entry.PressContact as string);
            }
        });

        // Remove duplicates
        const uniqueEmails = emails.filter((email, index, self) => self.indexOf(email) === index);

        //console.log('Unique emails: ', uniqueEmails);
        const filteredEmails = uniqueEmails.filter((email) => email !== newData.PressContact);

        // Send emails to all unique contacts
        for (const email of uniqueEmails) {
            const user: EmailSender = {
                email: email,
                name: email, // Using email as name since we don't have separate names
            };
            await handleClashEmail(user, newData, currentSelectedDate, filteredEmails, dateEntries);
        }
    }
}

export async function handleClashEmail(
    user: EmailSender,
    data: FieldValues,
    currentSelectedDate: Date,
    filteredEmails: string[],
    dateEntries: object
) {
    console.log("dateEntries: ", dateEntries);
    console.log("filteredEmails: ", filteredEmails);

    const emailSent = await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "Clash Diary Notification",
        templateName: "clash",
        sender: { name: "SOLT", email: "noreply@solt.co.uk" },
        params: {
            name: user.name,
            email: user.email,
            Date: format(currentSelectedDate, "dd/MM/yyyy"),
            Venue: data.Venue,
            TitleOfShow: data.TitleOfShow,
            MemberLevel: data.MemberLevel,
            IsOperaDance: data.IsOperaDance,
            IsSeasonGala: data.IsSeasonGala,
            clashEmails: filteredEmails.join(", "),
            dateEntries: JSON.stringify(dateEntries),
        },
    });

    if (emailSent) {
        //console.log('Clash email sent successfully');
    } else {
        console.error("Failed to send clash email");
    }
}

export function processRangeForCSV(
    dateRange: { from: Date; to: Date },
    Dates: RequestData["Dates"]
) {
    console.log("dateRange", dateRange);

    // Since dateRange.from and dateRange.to are Date objects, we can use them directly
    const fromDate = dateRange.from;
    const toDate = dateRange.to;

    console.log("fromDate: ", fromDate);
    console.log("toDate: ", toDate);

    const result = Object.keys(Dates)
        .filter((dateKey) => {
            // Parsing the date string using the 'parse' function from date-fns
            const keyDate = parse(dateKey, "dd/MM/yyyy", new Date());
            return isWithinInterval(keyDate, { start: fromDate, end: toDate });
        })
        .reduce((acc: { [key: string]: any }, dateKey: string) => {
            Object.keys(Dates[dateKey]).forEach((rangeKey: string) => {
                acc[rangeKey] = Dates[dateKey][rangeKey];
            });
            return acc;
        }, {});

    return result;
}
