"use client";

import * as React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useExcel } from "@/context/ExcelContext";
import { toast } from "@/components/ui/use-toast";
import BookingForm from "./BookingForm";
import { prepareBookingFormData } from "@/lib/utils"
import { FieldValues } from 'react-hook-form';

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
	console.log("currentDetail", currentDetail);
	const initialValues = {
		Day: format(currentSelectedDate, "EEEE") || "",
		Date: currentSelectedDate,
		P: currentDetail.P || false,
		Venue: currentDetail.Venue || "",
		OtherVenue: currentDetail.OtherVenue || "",
		VenueIsTba: currentDetail.VenueIsTba || false,
		TitleOfShow: currentDetail.TitleOfShow || "",
		ShowTitleIsTba: currentDetail.ShowTitleIsTba || false,
		Producer: currentDetail.Producer || "",
		PressContact: currentDetail.PressContact || "",
		DateBkd: currentDetail.DateBkd || "",
		IsSeasonGala:currentDetail.IsSeasonGala || false,
		IsOperaDance: currentDetail.IsOperaDance || false,
		UserId: "" // @todo This will check for the user id when it's available. Currently, it's hardcoded as an empty string.
	}
	
	// Context
    const { callExcelMethod, refreshData } = useExcel();
	
    const handleSubmit = async (data: FieldValues) => {

        try {

            await callExcelMethod(
                "editRow",
                rowRange,
                prepareBookingFormData(data)
            );

            await refreshData();

            toast({
                title: "Booking updated successfully",
                description: "Your changes have been saved.",
            });

        } catch (error) {

            console.error("Error updating booking:", error);
            toast({
                title: "Error updating booking",
                description:
                    "There was an error updating your booking. Please try again.",
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
