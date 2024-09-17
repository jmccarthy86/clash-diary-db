"use client";

import * as React from "react";
import { format, parse, isSameDay } from "date-fns";
import { useExcel } from "@/context/ExcelContext";
import { toast } from "@/components/ui/use-toast";
import BookingForm from "./BookingForm";
import { prepareBookingFormData, handleClashEmails } from "@/lib/utils";
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

    let venue = currentDetail.Venue;
    let otherVenue = currentDetail.OtherVenue;

    if (currentDetail.Venue !== "" && selectedVenue === undefined) {
        otherVenue = currentDetail.Venue;
    } else if (currentDetail.Venue !== "" && selectedVenue) {
        venue = currentDetail.Venue;
    }

    const initialValues = {
        Day: format(currentSelectedDate, "EEEE") || "",
        Date: currentSelectedDate,
        P: currentDetail.P || false,
        Venue: venue,
        OtherVenue: otherVenue,
        VenueIsTba: currentDetail.VenueIsTba || false,
        TitleOfShow: currentDetail.TitleOfShow || "",
        ShowTitleIsTba: currentDetail.ShowTitleIsTba || false,
        Producer: currentDetail.Producer || "",
        PressContact: currentDetail.PressContact || "",
        DateBkd: currentDetail.DateBkd || "",
        IsSeasonGala: currentDetail.IsSeasonGala || false,
        IsOperaDance: currentDetail.IsOperaDance || false,
        UserId: currentDetail.UserId || 0,
    };

    // Context
    const { callExcelMethod, refreshData, yearData } = useExcel();

    const handleSubmit = async (data: FieldValues) => {
        // console.log("Row Range : ", rowRange);
        // console.log("Data : ", data);
        // console.log("Current Date", currentSelectedDate );

        try {
            await callExcelMethod("editRow", rowRange, prepareBookingFormData(data));

            //console.log("email conditional: ", data, yearData);
            if (yearData) {
                const originalDateFormatted = format(currentSelectedDate, "dd/MM/yyyy");
                const newDateFormatted = format(new Date(data.Date), "dd/MM/yyyy");

                // Check if there are bookings on the new date
                const newDateEntries = yearData.Dates[newDateFormatted];

                if (newDateEntries && Object.keys(newDateEntries).length > 0) {
                    //console.log("Bookings found for the new date:", newDateEntries);

                    let dateBeforeEdit: Date | null = null;
                    const dateBeforeEditString: string = yearData.Dates[originalDateFormatted][
                        rowRange
                    ].Date
                        ? (yearData.Dates[originalDateFormatted][rowRange].Date as string)
                        : "";

                    if (dateBeforeEditString !== null) {
                        dateBeforeEdit = parse(dateBeforeEditString, "dd/MM/yyyy", new Date());
                        //console.log("dateBeforeEdit", dateBeforeEdit);
                        //console.log("data.Date", data.Date);

                        // Ensure data.Date is also a Date object
                        const dataDate: Date = new Date(data.Date);

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
