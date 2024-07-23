"use client"

import * as React from "react";
import { enGB } from "date-fns/locale"
import { format, isAfter, isBefore, isEqual, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import BookingDetail from "@/components/bookings/BookingDetail";
import { useExcel } from '@/context/ExcelContext';
import { Dialog, DialogDescription, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CreateBooking from "@/components/bookings/CreateBooking"

interface DetailCardProps {
  currentSelectedDate: Date | undefined;
  allowEdit: boolean;
}

export function Bookings({ currentSelectedDate, allowEdit }: DetailCardProps) {
  const { loading, error, yearData } = useExcel();

  if (!yearData || !currentSelectedDate) {
    return null;
  }

  const selectedDate = format(currentSelectedDate, "dd/MM/yyyy");

  const rows = yearData.Dates[selectedDate] || {};
  //console.log("Rows:", rows);

  if (loading) {
    return <p>Loading bookings...</p>;
  }

  if (error) {
    return <p>Error loading bookings: {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
		<div className="rounded-md border pl-6 pr-3 py-3 flex items-center justify-between">
			<h2 className="text-xl font-bold">
				{format(currentSelectedDate, "do MMMM yyyy")}
			</h2>
			<Dialog>
				<DialogTrigger asChild>
				{(isAfter(currentSelectedDate, new Date()) || isSameDay(currentSelectedDate, new Date())) && (
					<Button
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						Book Now
					</Button>
				)}
				</DialogTrigger>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
					<DialogTitle>Book Now</DialogTitle>
					<DialogDescription>
						Complete your booking for {format(currentSelectedDate, "dd/MM/yyyy" )}
					</DialogDescription>
					</DialogHeader>
					<CreateBooking currentSelectedDate={currentSelectedDate} />
				</DialogContent>
			</Dialog>
	  	</div>

      {Object.keys(rows).length === 0 ? (
		<div className="p-6 border rounded-md">
        	<p>No bookings for this date.</p>
		</div>
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