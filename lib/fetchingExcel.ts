import { RequestData } from "@/lib/types";
import { convertExcelDataToObject } from "@/lib/excelUtils";

/**
 * Created this file for the sake of keeping things easier to read.
 * Though, it may well be unnecessary to have in a separate file as
 * It may only ever be used by the handleClashEmail method.
 *
 * This method required that we manually get the latest data from excel
 * online, rather than just passing the already retrieved data in state.
 * Why?
 * Because the component actually doesn't re-render. So our handleClashEmail
 * method never got the latest data. Getting the data manually not dependent
 * on state was the simplest solution.
 */

export const callExcelMethod = async (
    method: string,
    year: number,
    ...args: any[]
): Promise<any> => {
    try {
        const response = await fetch("/api/manager", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method,
                year: year.toString(),
                args,
            }),
        });
        if (!response.ok) throw new Error("Failed to call Excel method");
        const { result } = await response.json();
        return result;
    } catch (err) {
        throw err;
    }
};

export const fetchAvailableYears = async (currentYear: number): Promise<number[]> => {
    try {
        const years = await callExcelMethod("getWorksheets", currentYear);
        return years.map(Number).sort((a: number, b: number) => b - a);
    } catch (err) {
        throw err;
    }
};

export const fetchData = async (currentYear: number): Promise<RequestData> => {
    try {
        const sheetData = await callExcelMethod("getUsedRangeValues", currentYear);
        return convertExcelDataToObject(sheetData, currentYear.toString());
    } catch (err) {
        throw err;
    }
};
