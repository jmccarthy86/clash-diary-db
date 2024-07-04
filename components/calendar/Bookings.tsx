"use client"

import * as React from "react";
import { Button } from "@/components/ui/button";
import BookingDetail from "@/components/bookings/BookingDetail";
import { useExcel } from '@/context/ExcelContext';

interface DetailCardProps {
  sheetData: any; 
  currentSelectedDate: Date | undefined;
  allowEdit: boolean;
}

export function Bookings({ currentSelectedDate, allowEdit }: DetailCardProps) {
  const { loading, error, yearData } = useExcel();

  if (!yearData || !currentSelectedDate) {
    return null;
  }

  const selectedDate = currentSelectedDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  const rows = yearData.Dates[selectedDate] || {};

  if (loading) {
    return <p>Loading bookings...</p>;
  }

  if (error) {
    return <p>Error loading bookings: {error.message}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        {currentSelectedDate.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </h2>

      <p className="mb-4">See existing bookings below.</p>

      {Object.keys(rows).length === 0 ? (
        <p>No bookings for this date.</p>
      ) : (
        Object.entries(rows).map(([rowRange, rowData]) => {
          return (
            <BookingDetail
              key={rowRange}
              rowRange={rowRange}
              rowData={rowData}
              currentSelectedDate={currentSelectedDate}
              allowEdit={allowEdit}
            />
          )
        })
      )}
    </div>
  );
}