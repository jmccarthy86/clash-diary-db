"use client";

import React from "react";
import { useExcel } from "@/context/ExcelContext";
import { prepareBookingFormData, handleClashEmails } from "@/lib/utils";
import { createBooking } from "@/lib/actions/bookings";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingForm from "./BookingForm";
import { FieldValues } from "react-hook-form";

interface CreateBookingProps {
    currentSelectedDate: Date;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {

    const bookingDataRef = React.useRef<FieldValues | null>(null);
    const { refreshData } = useExcel();

    const handleSubmit = async (data: FieldValues) => {
        console.log(data);
        try {
            await createBooking(data); 

            toast({
                title: "Booking created successfully",
                description: "Your new booking has been added to the calendar.",
            });

            await refreshData();
        } catch (error) {
            console.error("Error creating booking:", error);
            toast({
                title: "Error creating booking",
                description: "There was an error creating your booking. Please try again.",
                variant: "destructive",
            });
        } finally {
            //handleClashEmails(currentSelectedDate, data);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Booking</CardTitle>
            </CardHeader>
            <CardContent>
                <BookingForm
                    currentSelectedDate={currentSelectedDate}
                    onSubmit={handleSubmit}
                    isEdit={false}
                />
            </CardContent>
        </Card>
    );
}
