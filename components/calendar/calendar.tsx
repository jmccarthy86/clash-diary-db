"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Bookings } from "./Bookings";
import CalendarSkeleton from "@/components/calendar/Skeleton"
import { useExcel } from "@/context/ExcelContext";

interface CalendarViewProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export function CalendarView({
    selectedDate,
    onDateChange,
}: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate);
    const { yearData, loading, error, currentYear, changeYear } = useExcel();

    //console.log("yearData : " + JSON.stringify(yearData));
    //console.log("rendering calendar");

    React.useEffect(() => {
      setCurrentMonth(selectedDate);
    }, [selectedDate]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            onDateChange(date);

            //console.log(date.getFullYear());
            //console.log(currentYear);
            const year = date.getFullYear();
            if (year !== currentYear) {
                changeYear(year);
            }
        }
    };

    const handleMonthChange = (date: Date) => {
        //console.log(date.getFullYear());
        //console.log(currentYear);
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
                const [day, month, year] = dateString.split("/").map(Number);
                return new Date(year, month - 1, day);
            });
    }, [yearData]);

	if (loading) {
		return <CalendarSkeleton />
	};
	
	// console.log(error);
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="flex flex-col lg:flex-row items-center lg:items-start space-x-2 gap-4">
            <Calendar
                mode="single"
                fromYear={2024}
                selected={selectedDate}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
                month={currentMonth}
                showOutsideDays={false}
                className="rounded-md border flex-none mb-2 lg:mb-0"
                modifiers={{ booked: bookedDates }}
                modifiersClassNames={{
                    booked: "calendar-triangle",
                }}
            />
			<div className="flex-grow">
				<Bookings
					currentSelectedDate={selectedDate}
					allowEdit={true}
				/>
			</div>
            {/* <Tabs defaultValue="detail" className="flex-grow">
                <TabsList>
                    <TabsTrigger value="detail">Detail</TabsTrigger>
                    <TabsTrigger value="create">Create</TabsTrigger>
                </TabsList>
                <TabsContent value="detail">
                    <Bookings
                        currentSelectedDate={selectedDate}
                        allowEdit={true}
                    />
                </TabsContent>
                <TabsContent value="create">
                    <CreateBooking
                        currentSelectedDate={selectedDate}
                    />
                </TabsContent>
            </Tabs> */}
        </div>
    );
}
