// context/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { RequestData } from "@/lib/types";
import { getYearData } from "@/lib/actions/bookings";

interface AppContextType {
  yearData: RequestData | undefined;
  loading: boolean;
  error: Error | null;
  currentYear: number;
  availableYears: number[];
  refreshData: () => Promise<void>;
  changeYear: (year: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [yearData, setYearData] = useState<RequestData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const transformedData = await getYearData(currentYear);
      setYearData(transformedData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    fetchData();
  }, [currentYear]);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const changeYear = useCallback(async (year: number) => {
    setCurrentYear(year);
    await fetchData();
  }, [fetchData]);

  return (
    <AppContext.Provider
      value={{ yearData, loading, error, currentYear, availableYears, refreshData, changeYear }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

