"use client"

import React from 'react';
import { startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListView from "@/components/table/ListView";
import { CalendarView } from "@/components/calendar/Calendar";
import { ExcelProvider, useExcel } from '@/context/ExcelContext';
import { CalendarIcon, TableIcon } from '@radix-ui/react-icons'

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
        <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-8 lg:p-12 xl:p-24">
            <Tabs defaultValue="calendar" className="w-[960px] max-w-full p-6 rounded-md border bg-background">
                <TabsList className="w-full lg:w-auto">
                    <TabsTrigger value="calendar"><div className="flex items-center gap-1"><CalendarIcon /><span>Calendar</span></div></TabsTrigger>
					<TabsTrigger value="table"><div className="flex items-center gap-1"><TableIcon /><span>List View</span></div></TabsTrigger>
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