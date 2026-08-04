"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { handleClashEmails } from "@/lib/utils";
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
    const { refreshData } = useApp();

    const handleSubmit = async (data: FieldValues) => {
        console.log(data);
        let bookingId: string | number | null = null;
        let shouldSendClashEmails = false;
        try {
            // Build a literal YYYY-MM-DD from the selected calendar day
            const d: Date = data.date instanceof Date ? (data.date as Date) : currentSelectedDate;
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const createdBooking = await createBooking({ ...data, dateYmd: ymd });
            bookingId = (createdBooking as any)?.id ?? null;
            shouldSendClashEmails = true;

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
            if (shouldSendClashEmails) {
                await handleClashEmails(currentSelectedDate, data, {
                    bookingId,
                    trigger: "booking_created",
                });
            }
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
