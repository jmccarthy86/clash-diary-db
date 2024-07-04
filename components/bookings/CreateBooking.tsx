"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useExcel } from '@/context/ExcelContext';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { getGMTDateFormatted, convertToDate } from "@/lib/utils";

const FormSchema = z.object({
  Date: z.string().min(1, "Date is required"),
  Day: z.string().min(1, "Day is required"),
  Venue: z.string().optional(),
  OtherVenue: z.string().optional(),
  VenueIsTba: z.boolean().optional(),
  TitleOfShow: z.string().optional(),
  ShowTitleIsTba: z.boolean().optional(),
  Producer: z.string().min(1, "Producer is required"),
  PressContact: z.string().min(1, "Press contact is required"),
  P: z.boolean().optional(),
  IsSeasonGala: z.boolean().optional(),
  IsOperaDance: z.boolean().optional(),
});

interface CreateBookingProps {
  currentSelectedDate: Date | string;
}

export default function CreateBooking({ currentSelectedDate }: CreateBookingProps) {
  const { excelManager, refreshData } = useExcel();
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      Date: currentSelectedDate ? getGMTDateFormatted(convertToDate(currentSelectedDate)) : "",
      Day: currentSelectedDate ? new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(convertToDate(currentSelectedDate)) : "",
      Venue: "",
      OtherVenue: "",
      VenueIsTba: false,
      TitleOfShow: "",
      ShowTitleIsTba: false,
      Producer: "",
      PressContact: "",
      P: false,
      IsSeasonGala: false,
      IsOperaDance: false,
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log("Form data on submit:", data);  // Debugging log

    const preparedData = {
      Date: currentSelectedDate,
      Day: data.Day || "",
      Venue: data.Venue || data.OtherVenue || "",
      VenueIsTba: data.VenueIsTba ? "TBA" : "",
      TitleOfShow: data.TitleOfShow || "",
      ShowTitleIsTba: data.ShowTitleIsTba ? "TBA" : "",
      Producer: data.Producer || "",
      PressContact: data.PressContact || "",
      P: data.P ? "P" : "",
      IsSeasonGala: data.IsSeasonGala ? "Yes" : "",
      IsOperaDance: data.IsOperaDance ? "Yes" : ""
    };

    console.log("Prepared data for submission:", preparedData);  // Debugging log

    try {
      await excelManager?.submitData('create', null, preparedData);
      toast({
        title: "Booking created successfully",
        description: "Your new booking has been added to the calendar.",
      });
      await refreshData(); // Refresh the data after successful submission
      form.reset(); // Reset the form after successful submission
    } catch (error) {
      console.error('Error creating booking:', error);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid w-full items-center gap-4">
              <FormField
                control={form.control}
                name="Date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input id="date" {...field} readOnly />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <input type="hidden" {...form.register("Day")} />

              <div>
                <FormLabel>SOLT Member Venue</FormLabel>
                <div className="flex space-x-1.5 w-full">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="Venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger id="solt-venue" className="w-full">
                                <SelectValue placeholder="Select a Venue..." />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                <SelectItem value="WATERMILL">WATERMILL</SelectItem>
                                <SelectItem value="venue2">Venue 2</SelectItem>
                                <SelectItem value="venue3">Venue 3</SelectItem>
                                <SelectItem value="venue4">Venue 4</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5 w-1/2">
                    <FormField
                      control={form.control}
                      name="OtherVenue"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input id="OtherVenue" {...field} placeholder="Venue Name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="VenueIsTba"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Tick box if a TBA</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="TitleOfShow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Show Title</FormLabel>
                      <FormControl>
                        <Input id="show-title" {...field} disabled={form.watch("ShowTitleIsTba")} placeholder="Name of your project" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ShowTitleIsTba"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Tick box if a TBA</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex space-x-1.5">
                <div className="flex flex-col space-y-1.5 w-1/2">
                  <FormField
                    control={form.control}
                    name="Producer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Producer</FormLabel>
                        <FormControl>
                          <Input id="Producer" {...field} placeholder="Producer(s) Name(s)" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col space-y-1.5 w-1/2">
                  <FormField
                    control={form.control}
                    name="PressContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Press Contact (tel/email)</FormLabel>
                        <FormControl>
                          <Input id="PressContact" {...field} placeholder="press@soltukt.co.uk" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="P"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Make this a penciled (P) booking</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="IsSeasonGala"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Mark this as a Season Announcement or Gala Night</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="IsOperaDance"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Mark as Opera/Dance</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}