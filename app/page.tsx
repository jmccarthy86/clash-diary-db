"use client"

import React from 'react';
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListView from "@/components/table/table";
import { CalendarView } from "@/components/calendar/calendar";
import { ExcelProvider, useExcel } from '@/context/ExcelContext';

function MainContent() {
    const { loading, error } = useExcel();
    const [dateRange, setDateRange] = React.useState<{ from: Date, to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [singleDate, setSingleDate] = React.useState<Date>(new Date());

    const handleDateRangeChange = (newRange: { from: Date, to: Date }) => {
        setDateRange(newRange);
        setSingleDate(startOfDay(newRange.from));
    };

    const handleSingleDateChange = (newDate: Date) => {
        setSingleDate(newDate);
        setDateRange({
            from: startOfMonth(newDate),
            to: endOfMonth(newDate),
        });
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <Tabs defaultValue="calendar" className="w-[960px]">
                <TabsList>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar">
                    <CalendarView 
                        selectedDate={singleDate} 
                        onDateChange={handleSingleDateChange}
                    />
                </TabsContent>
                <TabsContent value="table">
                    <ListView 
                        dateRange={dateRange} 
                        onDateRangeChange={handleDateRangeChange}
                    />
                </TabsContent>
            </Tabs>
        </main>
    );
}

export default function Home() {
    return (
        <ExcelProvider>
            <MainContent />
        </ExcelProvider>
    );
}