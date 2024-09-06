"use client";

import React, { useState, useEffect, useCallback } from "react";
import { prepareBookingFormData, handleClashEmails } from "@/lib/utils";
import { convertExcelDataToObject } from "@/lib/excelUtils";
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingForm from "./BookingForm";
import { FieldValues } from "react-hook-form";

interface CreateBookingProps {
    currentSelectedDate: Date;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {
    const [yearData, setYearData] = useState<any>(null); // Local state for yearData
    const [currentYear] = useState<number>(new Date().getFullYear());

    // Separate function to call the Excel method
    const callExcelMethod = useCallback(
        async (method: string, ...args: any[]) => {
            try {
                const response = await fetch("/api/manager", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        method,
                        year: currentYear.toString(),
                        args,
                    }),
                });
                if (!response.ok) throw new Error("Failed to call Excel method");
                const { result } = await response.json();
                return result;
            } catch (err) {
                throw err;
            }
        },
        [currentYear]
    );

    // Separate function to fetch the latest data (not relying on the context)
    const fetchData = useCallback(async () => {
        try {
            const sheetData = await callExcelMethod("getUsedRangeValues");
            const transformedData = convertExcelDataToObject(sheetData, currentYear.toString());
            setYearData(transformedData); // Update local yearData
            return transformedData;
        } catch (err) {
            throw err;
        }
    }, [callExcelMethod, currentYear]);

    const handleSubmit = async (data: FieldValues) => {
        try {
            // Call Excel method to create a new row
            await callExcelMethod("createNewRow", prepareBookingFormData(data), yearData?.Range);

            toast({
                title: "Booking created successfully",
                description: "Your new booking has been added to the calendar.",
            });

            // Fetch the latest year data after creating the booking
            const latestData = await fetchData(); // Fetch latest data separately

            // Use the latest data for handling clash emails
            if (latestData) {
                handleClashEmails(latestData, currentSelectedDate, data);
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
