"use client";

import * as React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useExcel } from "@/context/ExcelContext";
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loader";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import venues from "@/lib/venues";
//import { toast } from "@/components/ui/use-toast";

export default function BookingForm({
	initialData,
	onSubmit,
	isEdit,
	currentSelectedDate
  }: {
	initialData?: Record<string, any>;
	onSubmit: (data: Record<string, any>) => void;
	isEdit: boolean;
	currentSelectedDate: Date;
  }) {
	//console.log( "currently selected date form" + currentSelectedDate)
	//console.log(isNaN(currentSelectedDate.getTime()))
	
	const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
	const [submitting, setSubmitting] = React.useState(false);
	const [showNoChangesAlert, setShowNoChangesAlert] = React.useState(false);

	const defaultValues = initialData || {
		Day: "",
		Date: new Date(),
		P: false,
		Venue: "",
		OtherVenue: "",
		VenueIsTba: false,
		TitleOfShow: "",
		ShowTitleIsTba: false,
		Producer: "",
		PressContact: "",
		DateBkd: "",
		IsSeasonGala: false,
		IsOperaDance: false,
		UserId: ""
	}

	const FormSchema = z.object({
		Day: z.string().optional(),
		Date: z.date({
			required_error: "A date is required.",
		}),
		P: z.boolean().optional(),
		Venue: z.string().optional(),
		OtherVenue: z.string().optional(),
		VenueIsTba: z.boolean().optional(),
		TitleOfShow: z.string().optional(),
		ShowTitleIsTba: z.boolean().optional(),
		Producer: z.string().min(1, "Producer is required"),
		PressContact: z.string().min(1, "Press Contact is required"),
		IsSeasonGala: z.boolean().optional(),
		IsOperaDance: z.boolean().optional(),
		UserId: z.string().optional(),
		DateBkd: z.string().optional(),
	});

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultValues
    });

	const { formState: { isDirty } } = form;

	const handleSubmit = async (data: Record<string, any>) => {

        if (!isDirty) {
            setShowNoChangesAlert(true);
            return;
        }

		//console.log(data)
		setSubmitting(true);
		try {
		  await onSubmit(data);
		} finally {
		  setSubmitting(false);
		}
	};

	// Helper function to handle disabling fields
	const isFieldDisabled = (fieldName: string) => {
		if (submitting) return true;
		if (fieldName === "TitleOfShow") return form.watch("ShowTitleIsTba");
		return false;
	};

	React.useEffect(() => {
		if (currentSelectedDate) {
			form.setValue('Date', currentSelectedDate);
			form.setValue('Day', format(currentSelectedDate, "EEEE"));
		}
	}, [currentSelectedDate, form]);

    return (
        <div className="w-full" style={{ pointerEvents: isCalendarOpen ? 'none' : 'auto' }}>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                >
                    <div className="grid w-full items-center gap-4">
					<FormField
						control={form.control}
						name="Date"
						render={({ field }) => (
							<FormItem className="flex flex-col">
							<FormLabel>Date</FormLabel>
							<Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
								<PopoverTrigger asChild>
								<FormControl>
									<Button
									variant={"outline"}
									className={cn(
										"w-full pl-3 text-left font-normal",
										!field.value && "text-muted-foreground"
									)}
									disabled={submitting}
									onClick={() => setIsCalendarOpen(true)}
									>
									{field.value ? (
										format(field.value, "do MMMM yyyy")
									) : (
										<span>Pick a date</span>
									)}
									<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
									</Button>
								</FormControl>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start" style={{ pointerEvents: 'auto' }}>
								<Calendar
									mode="single"
									selected={field.value}
									onSelect={(date) => {
									field.onChange(date);
										setTimeout(() => setIsCalendarOpen(false), 175);
									}}
									initialFocus
								/>
								</PopoverContent>
							</Popover>
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
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
														disabled={submitting}
                                                    >
                                                        <SelectTrigger
                                                            id="solt-venue"
                                                            className="w-full"
                                                        >
                                                            <SelectValue placeholder="Select a Venue..." />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
															<>
															{venues && venues.map( (venue, index) => (
																<SelectItem key={index} value={venue}>
																	{venue}
																</SelectItem>
															))}
															</>
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
                                                    <Input
                                                        id="OtherVenue"
                                                        {...field}
                                                        placeholder="Venue Name"
														disabled={submitting}
                                                    />
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
                                                        onCheckedChange={
                                                            field.onChange
                                                        }
														disabled={submitting} 
                                                    />
                                                </FormControl>
                                                <FormLabel>
                                                    Tick box if a TBA
                                                </FormLabel>
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
                                            <Input
                                                id="show-title"
                                                {...field}
												disabled={isFieldDisabled("TitleOfShow")} 
                                                placeholder="Name of your project"
                                            />
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
												disabled={submitting}
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
                                                <Input
                                                    id="Producer"
                                                    {...field}
                                                    placeholder="Producer(s) Name(s)"
													disabled={submitting}
                                                />
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
                                            <FormLabel>
                                                Press Contact (tel/email)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="PressContact"
                                                    {...field}
                                                    placeholder="press@soltukt.co.uk"
													disabled={submitting}
                                                />
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
												disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormLabel>
                                            Make this a penciled (P) booking
                                        </FormLabel>
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
												disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormLabel>
                                            Mark this as a Season Announcement
                                            or Gala Night
                                        </FormLabel>
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
												disabled={submitting}
                                            />
                                        </FormControl>
                                        <FormLabel>
                                            Mark as Opera/Dance
                                        </FormLabel>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
					<div className="flex items-center gap-2">
						<Button type="submit">
							{submitting ? (
								<div className="flex items-center gap-2">
									<LoadingSpinner />
									<span>Saving</span>
								</div>
							) : (
								<span>{isEdit ? 'Save Changes' : 'Create Booking'}</span>
							)}
						</Button>
						{isEdit && ! submitting && showNoChangesAlert && <span className="text-red-600">No changes to save.</span>}
					</div>
                </form>
            </Form>
        </div>
    );
}
