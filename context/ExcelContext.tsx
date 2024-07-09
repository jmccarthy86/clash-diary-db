// context/ExcelContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { RequestData } from "@/lib/types";

import { convertExcelDataToObject } from "@/lib/excelUtils";

interface ExcelContextType {
    yearData: RequestData | null;
    loading: boolean;
    error: Error | null;
    currentYear: number;
    availableYears: number[];
    refreshData: () => Promise<void>;
    changeYear: (year: number) => Promise<void>;
    callExcelMethod: (method: string, ...args: any[]) => Promise<any>;
}

const ExcelContext = createContext<ExcelContextType | undefined>(undefined);

export const ExcelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [yearData, setYearData] = useState<RequestData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentYear, setCurrentYear] = useState<number>(
        new Date().getFullYear()
    );
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    const callExcelMethod = useCallback(
        async (method: string, ...args: any[]) => {
            console.log("Calling Excel method:", method, "with args:", args);
            try {
                const response = await fetch("/api/manager", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        method,
                        year: currentYear.toString(),
                        args,
                    }),
                });
                if (!response.ok)
                    throw new Error("Failed to call Excel method");
                const { result } = await response.json();
                return result;
            } catch (err) {
                setError(err as Error);
                throw err;
            }
        },
        [currentYear]
    );

    const fetchAvailableYears = useCallback(async () => {
        try {
            const years = await callExcelMethod("getWorksheets");
            setAvailableYears(years.map(Number).sort((a: number, b: number) => b - a));

            if (!years.includes(currentYear)) {
                setCurrentYear(Number(years[0]) || new Date().getFullYear());
            }
        } catch (err) {
            setError(err as Error);
        }
    }, [callExcelMethod, currentYear]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const sheetData = await callExcelMethod("getUsedRangeValues");
            const transformedData = convertExcelDataToObject(
                sheetData,
                currentYear.toString()
            );
            setYearData(transformedData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [callExcelMethod, currentYear]);

    useEffect(() => {
        fetchAvailableYears();
    }, []);

    useEffect(() => {
        fetchData();
    }, [currentYear]);

    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

	const changeYear = useCallback(async (year: number) => {
		if (availableYears.includes(year)) {
		  setCurrentYear(year);
		} else {
		  try {
			
			setLoading(true);

			// Attempt to create a new worksheet for the year
			const newWorksheetId = await callExcelMethod('createWorksheet', year.toString());
			
			// Get the new worksheet's data
			const newSheetData = await callExcelMethod('getUsedRangeValues');

			// Convert the data to our object format
			const convertedData = convertExcelDataToObject(newSheetData, year.toString());
			
			// Update the available years
			setAvailableYears(prevYears => [...prevYears, year].sort((a, b) => b - a));
			
			// Set the current year to the new year
			setCurrentYear(year);
			
			// Update the yearData with the new sheet's data
			setYearData(convertedData);
			
			console.log(`Created new worksheet for year ${year} with ID: ${newWorksheetId}`);
		  } catch (error) {
			console.error(`Failed to create worksheet for year ${year}:`, error);
			throw new Error(`Failed to create worksheet for year ${year}`);
		  } finally {
			setLoading(false)
		  }
		}
	  }, [availableYears, callExcelMethod, setYearData]);

    return (
        <ExcelContext.Provider
            value={{
                yearData,
                loading,
                error,
                currentYear,
                availableYears,
                refreshData,
                changeYear,
                callExcelMethod,
            }}
        >
            {children}
        </ExcelContext.Provider>
    );
};

export const useExcel = () => {
    const context = useContext(ExcelContext);
    if (context === undefined) {
        throw new Error("useExcel must be used within an ExcelProvider");
    }
    return context;
};
