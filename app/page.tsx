"use client"

import React from 'react';
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListView from "@/components/table/ListView";
import { CalendarView } from "@/components/calendar/calendar";
import { ExcelProvider, useExcel } from '@/context/ExcelContext';

function MainContent() {
    
    //console.log("MainContent rendered");
    //const { loading, error } = useExcel();
 
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

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <Tabs defaultValue="calendar" className="w-[960px] p-6 rounded-md border bg-background">
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