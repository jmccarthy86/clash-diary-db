// context/ExcelContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RequestData } from "@/lib/types";

import { convertExcelDataToObject } from '@/lib/excelUtils'

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
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const callExcelMethod = useCallback(async (method: string, ...args: any[]) => {
    console.log('Calling Excel method:', method, 'with args:', args);
    try {
      const response = await fetch('/api/manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, year: currentYear.toString(), args }),
      });
      if (!response.ok) throw new Error('Failed to call Excel method');
      const { result } = await response.json();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [currentYear]);

  const fetchAvailableYears = useCallback(async () => {
    try {
      const years = await callExcelMethod('getWorksheets');
      setAvailableYears(years.map(Number).sort((a, b) => b - a));
      
      if (!years.includes(currentYear)) {
        setCurrentYear(years[0] || new Date().getFullYear());
      }
    } catch (err) {
      setError(err as Error);
    }
  }, [callExcelMethod, currentYear]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const sheetData = await callExcelMethod('getUsedRangeValues');
      const transformedData = convertExcelDataToObject(sheetData, currentYear);
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
      // No need to call refreshData here as the useEffect will handle it
    } else {
      throw new Error('Invalid year selected');
    }
  }, [availableYears]);

  return (
    <ExcelContext.Provider value={{ 
      yearData, 
      loading, 
      error, 
      currentYear,
      availableYears,
      refreshData, 
      changeYear,
      callExcelMethod
    }}>
      {children}
    </ExcelContext.Provider>
  );
};

export const useExcel = () => {
  const context = useContext(ExcelContext);
  if (context === undefined) {
    throw new Error('useExcel must be used within an ExcelProvider');
  }
  return context;
};
