"use client";

import React, { useEffect, useRef } from "react";
import { useExcel } from "@/context/ExcelContext";
import { prepareBookingFormData, handleClashEmails } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingForm from "./BookingForm";
import { FieldValues } from "react-hook-form";

interface CreateBookingProps {
    currentSelectedDate: Date;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {
    const { callExcelMethod, refreshData, yearData } = useExcel();
    const latestYearDataRef = useRef(yearData); // Ref to store latest yearData

    // Always keep the ref updated with the latest yearData
    useEffect(() => {
        latestYearDataRef.current = yearData;
    }, [yearData]);

    const handleSubmit = async (data: FieldValues) => {
        try {
            // Call Excel method to create a new row
            await callExcelMethod(
                "createNewRow",
                prepareBookingFormData(data),
                latestYearDataRef.current?.Range
            );

            toast({
                title: "Booking created successfully",
                description: "Your new booking has been added to the calendar.",
            });

            // Refresh the data to ensure we get the latest yearData
            await refreshData();

            // Use the latest yearData from the ref after refreshData
            if (latestYearDataRef.current) {
                handleClashEmails(latestYearDataRef.current, currentSelectedDate, data);
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            toast({
                title: "Error creating booking",
                description: "There was an error creating your booking. Please try again.",
                variant: "destructive",
            });
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
