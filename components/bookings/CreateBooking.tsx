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
import { EmailSender, RequestData } from '@/lib/types'
import { FieldValues } from 'react-hook-form';

interface CreateBookingProps {
  	currentSelectedDate: Date;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {

  	const { callExcelMethod, refreshData, yearData } = useExcel();

	  async function handleClashEmails(yearData: RequestData, currentSelectedDate: Date, newData: FieldValues) {
		const dateString = format(currentSelectedDate, 'dd/MM/yyyy');
		const dateEntries = yearData.Dates[dateString];
	
		if (dateEntries) {
			const emails: string[] = [];
	
			// Add the new entry's email
			if (newData.PressContact) {
				emails.push(newData.PressContact as string);
			}

			// Add emails from existing entries
			Object.values(dateEntries).forEach(entry => {
				if (entry.PressContact) {
					emails.push(entry.PressContact as string);
				}
			});
	
			// Remove duplicates
			const uniqueEmails = emails.filter((email, index, self) =>
				self.indexOf(email) === index
			);

			console.log( 'Unique emails: ', uniqueEmails);
	
			// Send emails to all unique contacts
			for (const email of uniqueEmails) {
				const user: EmailSender = {
					email: email,
					name: email // Using email as name since we don't have separate names
				};
				await handleClashEmail(user, newData);
			}
		}
	}

	async function handleClashEmail(user: EmailSender, data: FieldValues) {
		const emailSent = await sendEmail({
			to: [{ email: user.email, name: user.name }],
			subject: 'Clash Diary Notification',
			templateName: 'clash',
			sender: { name: 'SOLT', email: 'noreply@solt.co.uk' },
			params: {
				name: user.name,
				email: user.email,
				Date: format(currentSelectedDate, 'dd/MM/yyyy'),
				Venue: data.Venue,
				TitleOfShow: data.TitleOfShow,
				MemberLevel: data.MemberLevel,
				IsOperaDance: data.IsOperaDance,
				IsSeasonGala: data.IsSeasonGala
			},
		});

		if (emailSent) {
			console.log('Clash email sent successfully');
		} else {
			console.error('Failed to send clash email');
		}
	}

  	const handleSubmit = async (data: FieldValues) => {
    try {

      	await callExcelMethod('createNewRow', prepareBookingFormData(data), yearData?.Range);

		// const user = {
		// 	name: data.PressContact,
		// 	email: data.PressContact
		// }

		if ( yearData ) {
			handleClashEmails(yearData, currentSelectedDate, data);
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