import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Booking, RequestData, SubRowData } from "@/lib/types";
import { format, isValid, parseISO, isWithinInterval, parse } from "date-fns";
import { headers } from "@/lib/config";
import { sendEmail } from "./emailService";
import { EmailSender } from "@/lib/types";
import { FieldValues } from "react-hook-form";
import { getYearData } from "@/lib/actions/bookings";

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

// Date-only formatting (ignores timezones by using local date parts)
const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function formatDateLiteralDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function formatDateLiteralLong(date: Date): string {
    const day = date.getDate();
    const monthName = MONTH_NAMES[date.getMonth()] ?? "";
    const year = date.getFullYear();
    return `${day} ${monthName} ${year}`;
}

// London-aware date formatting helpers (use the UK site timezone)
const LONDON_TZ = "Europe/London";

function normalizeDateInput(value: Date | number | string): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value === "number") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    if (typeof value === "string") {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

export function formatLondonDate(value: Date | number | string): string {
    const d = normalizeDateInput(value);
    if (!d) return "";
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: LONDON_TZ,
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(d);
}

export function formatLondonDateShort(value: Date | number | string): string {
    const d = normalizeDateInput(value);
    if (!d) return "";
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: LONDON_TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
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
            const normalizedUserId = coalesceString(
                (data as any).UserId,
                (data as any).userId,
                (data as any).user_id
            );

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
                ...data,
                UserId: normalizedUserId,
                userId: normalizedUserId,
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

export function resolveTitleOfShow(
    rawTitle: unknown,
    showTitleIsTba?: unknown
): string {
    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const looksTba = title.toLowerCase() === "tba";
    if (title.length > 0) {
        return looksTba ? "TBA" : title;
    }
    // Treat empty title as TBA so UI always reflects unknown titles
    return Boolean(showTitleIsTba) || looksTba || title.length === 0 ? "TBA" : "";
}

type VenueDisplayInput = {
    venue?: unknown;
    otherVenue?: unknown;
    affiliateVenue?: unknown;
    uktVenue?: unknown;
    venueIsTba?: unknown;
    soltMemberNonSoltVenue?: unknown;
};

type VenueInfo = {
    venue: string;
    membership: string;
    isTba: boolean;
    isSoltMemberNonSoltVenue: boolean;
};

const VENUE_SOURCES: Array<[keyof VenueDisplayInput, string]> = [
    ["venue", "SOLT Venue"],
    ["uktVenue", "UK Theatre Venue"],
    ["affiliateVenue", "Affiliate Venue"],
    ["otherVenue", "Other"],
];

const pickVenue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function resolveVenueInfo(venueData: VenueDisplayInput): VenueInfo {
    if (Boolean(venueData.venueIsTba)) {
        return { venue: "TBA", membership: "", isTba: true, isSoltMemberNonSoltVenue: false };
    }

    const isSoltMemberNonSolt = Boolean(venueData.soltMemberNonSoltVenue);
    if (isSoltMemberNonSolt) {
        const picked =
            pickVenue(venueData.uktVenue) ||
            pickVenue(venueData.affiliateVenue) ||
            pickVenue(venueData.otherVenue) ||
            pickVenue(venueData.venue);
        return {
            venue: picked || "TBA",
            membership: "SOLT Member (non-SOLT venue)",
            isTba: false,
            isSoltMemberNonSoltVenue: true,
        };
    }

    for (const [key, membership] of VENUE_SOURCES) {
        const value = pickVenue(venueData[key]);
        if (value) {
            return {
                venue: value,
                membership,
                isTba: false,
                isSoltMemberNonSoltVenue: false,
            };
        }
    }

    if (Boolean(venueData.venueIsTba)) {
        return { venue: "TBA", membership: "", isTba: true, isSoltMemberNonSoltVenue: false };
    }

    // When nothing is provided, treat venue as TBA for display consistency
    return { venue: "TBA", membership: "", isTba: true, isSoltMemberNonSoltVenue: false };
}

export function resolveVenueDisplay(venueData: VenueDisplayInput): string {
    return resolveVenueInfo(venueData).venue;
}

export function resolveVenueMembership(venueData: VenueDisplayInput): string {
    return resolveVenueInfo(venueData).membership;
}

export function toBooleanLike(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return false;
        return (
            normalized === "1" ||
            normalized === "true" ||
            normalized === "yes" ||
            normalized === "y" ||
            normalized === "on"
        );
    }
    return false;
}

export function coalesceString(...values: unknown[]): string {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value;
        }
    }
    for (const value of values) {
        if (typeof value === "string") return value;
        if (value !== null && value !== undefined) return String(value);
    }
    return "";
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

export async function handleClashEmails(currentSelectedDate: Date, newData: FieldValues) {
    const currentYear = currentSelectedDate.getFullYear();
    const yearData = await getYearData(currentYear);

    // Guard against undefined yearData (e.g., db error)
    if (!yearData || !yearData.Dates) {
        return false;
    }

    const dateString = format(currentSelectedDate, "dd/MM/yyyy");
    const dateEntries = yearData.Dates[dateString];

    if (
        !dateEntries ||
        typeof dateEntries === "undefined" ||
        (dateEntries && Object.keys(dateEntries).length < 2)
    ) {
        return false;
    }

    if (dateEntries) {
        const emails: string[] = [];

        // Add the new entry's email from DB-style key
        const newEmail = (newData as any).pressContact as string | undefined;
        if (newEmail) emails.push(newEmail);

        // Add emails from existing entries
        Object.values(dateEntries).forEach((entry: any) => {
            const pc = entry.pressContact as string | undefined;
            if (pc) emails.push(pc);
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

export async function handlePencilConfirmedEmails(
    currentSelectedDate: Date,
    newData: FieldValues
) {
    const currentYear = currentSelectedDate.getFullYear();
    const yearData = await getYearData(currentYear);

    // Guard against undefined yearData (e.g., db error)
    if (!yearData || !yearData.Dates) {
        return false;
    }

    const dateString = format(currentSelectedDate, "dd/MM/yyyy");
    const dateEntries = yearData.Dates[dateString];

    if (
        !dateEntries ||
        typeof dateEntries === "undefined" ||
        (dateEntries && Object.keys(dateEntries).length < 2)
    ) {
        return false;
    }

    const emails: string[] = [];

    // Add the new entry's email from DB-style key
    const newEmail = (newData as any).pressContact as string | undefined;
    if (newEmail) emails.push(newEmail);

    // Add emails from existing entries
    Object.values(dateEntries).forEach((entry: any) => {
        const pc = entry.pressContact as string | undefined;
        if (pc) emails.push(pc);
    });

    const uniqueEmails = emails.filter(
        (email, index, self) => self.indexOf(email) === index
    );

    const paramsBase = {
        date: format(currentSelectedDate, "dd/MM/yyyy"),
        rawDate: format(currentSelectedDate, "yyyy-MM-dd"),
        venue: resolveVenueDisplay({
            venue: (newData as any).venue,
            otherVenue: (newData as any).otherVenue,
            affiliateVenue: (newData as any).affiliateVenue,
            uktVenue: (newData as any).uktVenue,
            venueIsTba: (newData as any).venueIsTba,
            soltMemberNonSoltVenue:
                (newData as any).soltMemberNonSoltVenue ??
                (newData as any).SoltMemberNonSoltVenue ??
                (newData as any).solt_member_non_solt_venue,
        }),
        titleOfShow: resolveTitleOfShow(
            (newData as any).titleOfShow,
            (newData as any).showTitleIsTba
        ),
    } as Record<string, any>;

    for (const email of uniqueEmails) {
        const params = { ...paramsBase, name: email, email };
        await sendEmail({
            to: [{ email, name: email }],
            subject: "SOLT & UK Theatre First Night Diary update",
            templateName: "pencilConfirmed",
            sender: { name: "SOLT", email: "noreply@solt.co.uk" },
            params,
        });
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

    // Use DB-style field names consistently in email params
    const params = {
        name: user.name,
        email: user.email,
        date: format(currentSelectedDate, "dd/MM/yyyy"),
        rawDate: format(currentSelectedDate, "yyyy-MM-dd"),
        venue: resolveVenueDisplay({
            venue: (data as any).venue,
            otherVenue: (data as any).otherVenue,
            affiliateVenue: (data as any).affiliateVenue,
            uktVenue: (data as any).uktVenue,
            venueIsTba: (data as any).venueIsTba,
            soltMemberNonSoltVenue:
                (data as any).soltMemberNonSoltVenue ??
                (data as any).SoltMemberNonSoltVenue ??
                (data as any).solt_member_non_solt_venue,
        }),
        titleOfShow: resolveTitleOfShow(
            (data as any).titleOfShow,
            (data as any).showTitleIsTba
        ),
        memberLevel: resolveVenueMembership({
            venue: (data as any).venue,
            otherVenue: (data as any).otherVenue,
            affiliateVenue: (data as any).affiliateVenue,
            uktVenue: (data as any).uktVenue,
            venueIsTba: (data as any).venueIsTba,
            soltMemberNonSoltVenue:
                (data as any).soltMemberNonSoltVenue ??
                (data as any).SoltMemberNonSoltVenue ??
                (data as any).solt_member_non_solt_venue,
        }),
        isOperaDance: Boolean((data as any).isOperaDance ?? false),
        isSeasonGala: Boolean((data as any).isSeasonGala ?? false),
        clashEmails: filteredEmails.join(", "),
        dateEntries: JSON.stringify(dateEntries),
    } as Record<string, any>;

    const emailSent = await sendEmail({
        to: [{ email: user.email, name: user.name }],
        subject: "SOLT & UK Theatre First Night Diary clash",
        templateName: "clash",
        sender: { name: "SOLT", email: "noreply@solt.co.uk" },
        params,
    });

    if (emailSent) {
        console.log("Clash email sent successfully");
    } else {
        console.error("Failed to send clash email");
    }
}

export function processRangeForCSV(
    dateRange: { from: Date; to: Date },
    Dates: RequestData["Dates"]
) {
    //console.log("dateRange", dateRange);

    // Since dateRange.from and dateRange.to are Date objects, we can use them directly
    const fromDate = dateRange.from;
    const toDate = dateRange.to;

    //console.log("fromDate: ", fromDate);
    //console.log("toDate: ", toDate);

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

// Function to convert an Excel date serial number, accounting for both date and time
const excelDateToJSDate = (serial: number): string => {
    //console.log("Original Excel serial number:", serial); // Log the original serial

    const excelEpoch = Date.UTC(1900, 0, 1); // January 1, 1900 in UTC
    //console.log("Excel epoch (milliseconds):", excelEpoch); // Log the Excel epoch time

    const days = Math.floor(serial); // Extract the date part (integer)
    const time = serial - days; // Extract the time part (decimal)

    //console.log("Days part (integer):", days); // Log the integer part (days)
    //console.log("Time part (decimal):", time); // Log the decimal part (time)

    // Convert the date part (days since epoch) in UTC
    const dateInMs = excelEpoch + (days - 2) * 24 * 60 * 60 * 1000;
    //console.log("Date in milliseconds (after adding days):", dateInMs); // Log the date in milliseconds

    // Create a new Date object with the calculated milliseconds in UTC
    const date = new Date(dateInMs);
    //console.log("Date object (before adding time):", date.toISOString()); // Log the date object before adding the time

    // Check if there's a time component (decimal part)
    if (time > 0) {
        const millisecondsInDay = 24 * 60 * 60 * 1000;
        const timeInMs = time * millisecondsInDay;
        //console.log("Milliseconds to add for time part:", timeInMs); // Log the milliseconds to add for the time part

        date.setUTCHours(0, 0, 0, 0); // Reset time to 00:00 in UTC
        date.setTime(date.getTime() + timeInMs);

        //console.log("Date object (after adding time):", date.toISOString()); // Log the date object after adding the time

        // Return date with time in 'dd/MM/yyyy HH:mm' format
        return format(date, "dd/MM/yyyy HH:mm");
    }

    //console.log("Final Date object (no time):", date.toISOString()); // Log the final date object if there's no time part

    // Return only the date if there's no time component, in 'dd/MM/yyyy' format
    return format(date, "dd/MM/yyyy");
};

// Function to check if the value is already in dd/MM/yyyy or needs to be converted
export const processDate = (value: string | number): string => {
    // Regular expression to check if the value is already in dd/MM/yyyy format
    const dateFormatRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    // If it's a string and matches the dd/MM/yyyy format, return it as is
    if (typeof value === "string" && dateFormatRegex.test(value)) {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate)) {
            return value; // Already in correct format
        }
    }

    // If it's a number (Excel date serial), convert it to a valid date format
    if (typeof value === "number") {
        return excelDateToJSDate(value);
    }

    // If the value is something else, return an empty string or handle error
    return "";
};
