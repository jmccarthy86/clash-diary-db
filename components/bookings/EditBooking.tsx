"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useExcel } from '@/context/ExcelContext';

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

const FormSchema = z.object({
  Date: z.string().min(1, "Date is required"),
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

interface EditBookingProps {
  rowRange: string;
  currentDetail: any;
  currentSelectedDate: Date | undefined;
}

export default function EditBooking({ rowRange, currentDetail, currentSelectedDate }: EditBookingProps) {
  const { submitData, refreshData } = useExcel();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      Date: currentDetail.Date || "",
      Venue: currentDetail.Venue || "",
      OtherVenue: currentDetail.OtherVenue || "",
      VenueIsTba: (currentDetail.VenueIsTba !== 'N/A' && currentDetail.VenueIsTba !== ''),
      TitleOfShow: currentDetail.TitleOfShow || "",
      ShowTitleIsTba: (currentDetail.ShowTitleIsTba !== 'N/A' && currentDetail.ShowTitleIsTba !== ''),
      Producer: currentDetail.Producer || "",
      PressContact: currentDetail.PressContact || "",
      P: (currentDetail.P !== 'N/A' && currentDetail.P !== ''),
      IsSeasonGala: (currentDetail.IsSeasonGala !== 'N/A' && currentDetail.IsSeasonGala !== ''),
      IsOperaDance: (currentDetail.IsOperaDance !== 'N/A' && currentDetail.IsOperaDance !== '')
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log("Form data on submit:", data);  // Debugging log

    const preparedData = {
      Date: data.Date || "",
      Venue: data.Venue || "",
      VenueIsTba: data.VenueIsTba ? "TBA" : "",
      OtherVenue: data.OtherVenue || "",
      TitleOfShow: data.TitleOfShow || "",
      ShowTitleIsTba: data.ShowTitleIsTba ? "TBA" : "",
      Producer: data.Producer || "",
      PressContact: data.PressContact || "",
      P: data.P ? "P" : "",
      IsSeasonGala: data.IsSeasonGala ? "Yes" : "",
      IsOperaDance: data.IsOperaDance ? "Yes" : ""
    };

    console.log("Prepared data for submission:", preparedData);  // Debugging log
    console.log("Row range:", rowRange);  // Debugging log

    try {
      await submitData('update', rowRange, preparedData);
      await refreshData(); // Refresh data after successful update
      toast({
        title: "Booking updated successfully",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error updating booking",
        description: "There was an error updating your booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
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
                    <Input id="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <FormMessage />
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
                        <FormMessage />
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
                    <FormMessage />
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
                    <FormMessage />
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
                      <FormMessage />
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
                      <FormMessage />
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
                    <FormMessage />
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </Form>
    </div>
  );
}