"use client";

import React from 'react';
import * as z from "zod";
import { useExcel } from '@/context/ExcelContext';
import { prepareBookingFormData } from '@/lib/utils';
import { toast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import BookingForm from './BookingForm';
import { sendEmail } from '@/lib/emailService';
import { format } from 'date-fns'
import { EmailSender } from '@/lib/types'
import { FieldValues } from 'react-hook-form';

interface CreateBookingProps {
  	currentSelectedDate: Date;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {

  	const { callExcelMethod, refreshData, yearData } = useExcel();

	// In your component
	async function handleClashEmail(user: EmailSender) {

		const emailSent = await sendEmail({
			to: [{ email: user.email, name: user.name }],
			subject: 'Clash Diary Notification',
			templateName: 'clash',
			sender: { name: 'SOLT', email: 'noreply@soltukt.co.uk' },
			params: {
				name: user.name,
				email: user.email,
			},
		});
	
		if (emailSent) {
			console.log('CLash email sent successfully');
		} else {
			console.error('Failed to send clash email');
		}
  	}

  	const handleSubmit = async (data: FieldValues) => {
    try {

      	await callExcelMethod('createNewRow', prepareBookingFormData(data), yearData?.Range);

	  	// Check for clashes and send email if necessary
	  	if ( yearData?.Dates[format( currentSelectedDate, 'dd/MM/yyyy' )] ) {
			const user = {
				name: data.PressContact,
				email: data.PressContact
			}
			handleClashEmail(user);
	  	}
	  
		toast({
			title: "Booking created successfully",
			description: "Your new booking has been added to the calendar.",
		});

		await refreshData();

	} catch (error) {

			console.error('Error creating booking:', error);
			toast({
				title: "Error creating booking",
				description: "There was an error creating your booking. Please try again.",
				variant: "destructive",
			});
		}
	};

  	console.log( "Current Selected Date:", currentSelectedDate);

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