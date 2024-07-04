"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateBooking from "@/components/bookings/CreateBooking";
import { Bookings } from "./Bookings";
import { useExcel } from '@/context/ExcelContext';
import { getGMTDateFormatted } from "@/lib/utils";

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function CalendarView({ selectedDate, onDateChange }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate);
  const { yearData, loading, error, currentYear, changeYear } = useExcel();

  console.log("yearData : " + JSON.stringify(yearData));

  React.useEffect(() => {
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      const year = date.getFullYear();
      if (year !== currentYear) {
        changeYear(year);
      }
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    const year = date.getFullYear();
    if (year !== currentYear) {
      changeYear(year);
    }
  };

  // Create an array of dates that have bookings
  const bookedDates = React.useMemo(() => {
    if (!yearData || !yearData.Dates) return [];
    return Object.entries(yearData.Dates)
      .filter(([_, entries]) => Object.keys(entries).length > 0)
      .map(([dateString, _]) => {
        const [day, month, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
      });
  }, [yearData]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="flex space-x-2">
      <Calendar
        mode="single"
        fromYear={2024}
        selected={selectedDate}
        onSelect={handleDateSelect}
        onMonthChange={handleMonthChange}
        month={currentMonth}
        showOutsideDays={false}
        className="rounded-md border"
        modifiers={{ booked: bookedDates }}
        modifiersClassNames={{ booked: "booked", dateBackground: "hover:bg-muted/50" }}
        modifiersStyles={{
          booked: { border: '2px solid blue' }
        }}
      />
      <Tabs defaultValue="detail">
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>
        <TabsContent value="detail">
          <Bookings currentSelectedDate={selectedDate} allowEdit={true}/>
        </TabsContent>
        <TabsContent value="create">
          <CreateBooking currentSelectedDate={getGMTDateFormatted(selectedDate)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}