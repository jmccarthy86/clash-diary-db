"use client";

import React from "react";
import { startOfMonth, endOfMonth, startOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListView from "@/components/table/ListView";
import { CalendarView } from "@/components/calendar/calendar";
import { ExcelProvider } from "@/context/ExcelContext";
import { CalendarIcon, TableIcon } from "@radix-ui/react-icons";

function MainContent() {
    const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [singleDate, setSingleDate] = React.useState<Date>(new Date());

    // Ref to indicate that the listener was added
    const hasListener = React.useRef(false);

    React.useEffect(() => {
        // Only add event listener once on initial mount
        if (!hasListener.current) {
            hasListener.current = true;

            const handleMessage = (event: MessageEvent) => {
                // Verify the origin to make sure it's the expected source
                if (event.origin !== "https://solt.co.uk") return;

                const { selectedDate } = event.data;

                // Ensure selectedDate is a valid date and different from the current date
                if (selectedDate && !isNaN(Date.parse(selectedDate))) {
                    const newDate = new Date(selectedDate);

                    // Only update if the selected date is actually new
                    if (newDate.getTime() !== singleDate.getTime()) {
                        setSingleDate(newDate);
                        setDateRange({
                            from: startOfMonth(newDate),
                            to: endOfMonth(newDate),
                        });
                    }
                }
            };

            // Register message event listener
            window.addEventListener("message", handleMessage);

            // Cleanup listener on unmount
            return () => {
                window.removeEventListener("message", handleMessage);
            };
        }
    }, [singleDate]); // Depend on singleDate to ensure it doesn't rerun unless needed

    const handleDateRangeChange = (newRange: { from: Date; to: Date }) => {
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
        <main className="flex min-h-screen flex-col items-center justify-between pb-4 sm:pb-6 md:pb-8 lg:pb-12 xl:pb-24 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-24">
            <Tabs
                defaultValue="calendar"
                className="w-[960px] max-w-full p-6 rounded-md border bg-background"
            >
                <TabsList className="w-full lg:w-auto">
                    <TabsTrigger value="calendar">
                        <div className="flex items-center gap-1">
                            <CalendarIcon />
                            <span>Calendar</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="table">
                        <div className="flex items-center gap-1">
                            <TableIcon />
                            <span>List View</span>
                        </div>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="calendar">
                    <CalendarView selectedDate={singleDate} onDateChange={handleSingleDateChange} />
                </TabsContent>
                <TabsContent value="table">
                    <ListView dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
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
