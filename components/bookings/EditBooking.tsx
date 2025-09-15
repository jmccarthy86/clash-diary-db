"use client";

import * as React from "react";
import { format, parse, isSameDay } from "date-fns";
import { useApp } from "@/context/AppContext";
import { updateBooking } from "@/lib/actions/bookings";
import { toast } from "@/components/ui/use-toast";
import BookingForm from "./BookingForm";
import { handleClashEmails } from "@/lib/utils";
import { FieldValues } from "react-hook-form";
import venues from "@/lib/venues";

interface EditBookingProps {
    rowRange: string;
    currentDetail: any;
    currentSelectedDate: Date;
}

export default function EditBooking({
    rowRange,
    currentDetail,
    currentSelectedDate,
}: EditBookingProps) {
    console.log(currentDetail);
    // if Venue is not empty and is not in the venues list, it should be set in the otherVenue field.
    const selectedVenue = venues.find((venue) => venue.value === currentDetail.Venue);

    let venue = currentDetail.venue;
    let otherVenue = currentDetail.otherVenue;

    if (currentDetail.venue !== "" && selectedVenue === undefined) {
        otherVenue = currentDetail.venue;
    } else if (currentDetail.venue !== "" && selectedVenue) {
        venue = currentDetail.venue;
    }

    const initialValues = {
        day: format(currentSelectedDate, "EEEE") || "",
        date: currentSelectedDate,
        p: !!currentDetail.p,
        venue: venue,
        uktVenue: currentDetail.uktVenue || "",
        otherVenue: otherVenue,
        venueIsTba: !!currentDetail.venueIsTba,
        titleOfShow: currentDetail.titleOfShow || "",
        showTitleIsTba: !!currentDetail.showTitleIsTba,
        producer: currentDetail.producer || "",
        pressContact: currentDetail.pressContact || "",
        dateBkd: currentDetail.dateBkd || "",
        isSeasonGala: !!currentDetail.isSeasonGala,
        isOperaDance: !!currentDetail.isOperaDance,
        userId: currentDetail.userId || "0",
    };

    // Context
    const { refreshData, yearData } = useApp();

    const handleSubmit = async (data: FieldValues) => {
        try {
            const d: Date = data.date instanceof Date ? (data.date as Date) : currentSelectedDate;
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            await updateBooking(rowRange, { ...data, dateYmd: ymd });

            if (yearData) {
                const originalDateFormatted = format(currentSelectedDate, "dd/MM/yyyy");
                const newDateFormatted = format(new Date(data.date), "dd/MM/yyyy");

                // Check if there are bookings on the new date
                const newDateEntries = yearData.Dates[newDateFormatted];

                if (newDateEntries && Object.keys(newDateEntries).length > 0) {
                    let dateBeforeEdit: Date | null = null;
                    const maybeEntry = yearData.Dates[originalDateFormatted]?.[rowRange];
                    const dateBeforeEditString = maybeEntry?.Date as string | undefined; // dd/MM/yyyy

                    if (dateBeforeEditString) {
                        dateBeforeEdit = parse(dateBeforeEditString, "dd/MM/yyyy", new Date());
                        const dataDate: Date = new Date(data.date);

                        if (dateBeforeEdit && !isSameDay(dateBeforeEdit, dataDate)) {
                            handleClashEmails(currentSelectedDate, data);
                        }
                    }
                } else {
                    console.log("No bookings found for the new date. Skipping email check.");
                }
            } else {
                console.log("No year data available. Skipping email check.");
            }

            await refreshData();

            toast({
                title: "Booking updated successfully",
                description: "Your changes have been saved.",
            });
        } catch (error) {
            console.error("Error updating booking:", error);
            toast({
                title: "Error updating booking",
                description: "There was an error updating your booking. Please try again.",
                variant: "destructive",
            });
        }
    };

    return (
        <BookingForm
            initialData={initialValues}
            currentSelectedDate={currentSelectedDate}
            onSubmit={handleSubmit}
            isEdit={true}
        />
    );
}
