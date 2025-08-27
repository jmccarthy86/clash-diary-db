// context/ExcelContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RequestData } from "@/lib/types";

import { convertExcelDataToObject } from "@/lib/excelUtils";
import { getYearData } from "@/lib/actions/bookings";


interface ExcelContextType {
    yearData: RequestData | null;
    loading: boolean;
    error: Error | null;
    currentYear: number;
    availableYears: number[];
    refreshData: () => Promise<void>;
    changeYear: (year: number) => Promise<void>;
}

const ExcelContext = createContext<ExcelContextType | undefined>(undefined);

export const ExcelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [yearData, setYearData] = useState<RequestData | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    console.log("yearData: ", yearData);
    console.log("current Year:", currentYear);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const transformedData = await getYearData(currentYear);
            console.log(transformedData);
            setYearData(transformedData);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [currentYear]);

    // useEffect(() => {
    //     fetchAvailableYears();
    // }, []);

    useEffect(() => {
        fetchData();
    }, [currentYear]);

    const refreshData = useCallback(async () => {
        await fetchData();
    }, [fetchData]);

    const changeYear = useCallback(
        async (year: number) => {
            setCurrentYear(year);
            await fetchData();
        },
        [fetchData]
    );

    return (
        <ExcelContext.Provider
            value={{
                yearData,
                loading,
                error,
                currentYear,
                availableYears,
                refreshData,
                changeYear
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
