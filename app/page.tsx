"use client";

import React from "react";
import { startOfMonth, endOfMonth, startOfDay } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListView from "@/components/table/ListView";
import { CalendarView } from "@/components/calendar/calendar";
import { ExcelProvider, useExcel } from "@/context/ExcelContext";
import { CalendarIcon, TableIcon } from "@radix-ui/react-icons";

function MainContent() {
    //console.log("MainContent rendered");
    //const { loading, error } = useExcel();

    // const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    //     from: startOfMonth(new Date()),
    //     to: endOfMonth(new Date()),
    // });
    // const [singleDate, setSingleDate] = React.useState<Date>(new Date());

    const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [singleDate, setSingleDate] = React.useState<Date>(new Date());

    React.useEffect(() => {
        // Function to handle message from parent window
        const handleMessage = (event: MessageEvent) => {
            // Make sure the origin is the expected one
            if (event.origin !== "https://solt.co.uk") return;

            const { selectedDate } = event.data;
            console.log(selectedDate);

            // Check if the message contains a valid date
            if (selectedDate && !isNaN(Date.parse(selectedDate))) {
                const newDate = new Date(selectedDate);
                setSingleDate(newDate);
                setDateRange({
                    from: startOfMonth(newDate),
                    to: endOfMonth(newDate),
                });
            }
        };

        // Add event listener for message
        window.addEventListener("message", handleMessage);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []); // Empty dependency array ensures this runs only on component mount

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
