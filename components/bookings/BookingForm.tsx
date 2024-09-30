"use client";

import * as React from "react";
import { format, setMilliseconds, setMinutes, setSeconds, setHours } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loader";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import venues from "@/lib/venues";
import affiliates from "@/lib/affiliates";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandList,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const FormSchema = z.object({
    Day: z.string().optional(),
    Date: z.date({
        required_error: "A date is required.",
    }),
    P: z.boolean().optional(),
    Venue: z.string().optional(),
    AffiliateVenue: z.string().optional(),
    OtherVenue: z.string().optional(),
    VenueIsTba: z.boolean().optional(),
    TitleOfShow: z.string().optional(),
    ShowTitleIsTba: z.boolean().optional(),
    Producer: z.string().min(1, "Producer is required"),
    PressContact: z.string().min(1, "Press Contact is required"),
    IsSeasonGala: z.boolean().optional(),
    IsOperaDance: z.boolean().optional(),
    UserId: z.number().optional(),
    DateBkd: z.string().optional(),
    TimeStamp: z.string().optional(),
});

export default function BookingForm({
    initialData,
    onSubmit,
    isEdit,
    currentSelectedDate,
}: {
    initialData?: Record<string, any>;
    onSubmit: (data: Record<string, any>) => void;
    isEdit: boolean;
    currentSelectedDate: Date;
}) {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [showNoChangesAlert, setShowNoChangesAlert] = React.useState(false);
    const [hasAuthCookie, setHasAuthCookie] = React.useState<number>(0);
    const [open, setOpen] = React.useState(false);
    const [openAffiliate, setOpenAffiliate] = React.useState(false);

    const defaultValues = React.useMemo(() => {
        if (initialData) {
            // We're editing, use initialData but override UserId if cookie exists
            return {
                ...initialData,
                UserId: hasAuthCookie || initialData.UserId || "",
            };
        } else {
            // We're creating new, use empty fields except for UserId and other specified fields
            return {
                Day: "",
                Date: new Date(),
                P: false,
                Venue: "",
                AffiliateVenue: "",
                OtherVenue: "",
                VenueIsTba: false,
                TitleOfShow: "",
                ShowTitleIsTba: false,
                Producer: "",
                PressContact: "",
                DateBkd: "",
                IsSeasonGala: false,
                IsOperaDance: false,
                UserId: hasAuthCookie || 0,
                TimeStamp: format(currentSelectedDate, "dd/MM/yyyy 00:00:00"),
                MemberLevel: "",
            };
        }
    }, [initialData, hasAuthCookie, currentSelectedDate]);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: defaultValues,
    });

    const handleSubmit = async (data: Record<string, any>) => {
        if (!isDirty) {
            setShowNoChangesAlert(true);
            return;
        }

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
        const checkAuthCookie = (cookies: string) => {
            const cookieArray = cookies.split(";");
            const clashSyncCookie = cookieArray.find((cookie) =>
                cookie.trim().startsWith("clash_sync=")
            );
            console.log("Clash Sync Cookie:", clashSyncCookie);
            if (clashSyncCookie && Number(clashSyncCookie.split("=")[1]) !== 0) {
                setHasAuthCookie(Number(clashSyncCookie.split("=")[1]));
            }
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== "https://solt.co.uk") {
                console.warn("Invalid origin:", event.origin);
                return;
            }

            if (event.data && event.data.cookies) {
                checkAuthCookie(event.data.cookies);
            } else {
                console.warn("No cookies in message data:", event.data);
            }
        };

        window.addEventListener("message", handleMessage);

        // Clean up the event listener on component unmount
        return () => {
            //console.log('Cleaning up message event listener in iframe');
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    React.useEffect(() => {
        if (currentSelectedDate) {
            form.setValue("Date", currentSelectedDate);
            form.setValue("Day", format(currentSelectedDate, "EEEE"));
        }
    }, [currentSelectedDate, form]);

    React.useEffect(() => {
        if (currentSelectedDate) {
            const now = new Date();
            // const combinedDate = setMilliseconds(
            //     setSeconds(
            //         setMinutes(setHours(currentSelectedDate, now.getHours()), now.getMinutes()),
            //         now.getSeconds()
            //     ),
            //     now.getMilliseconds()
            // );
            form.setValue("TimeStamp", format(now, "dd/MM/yyyy HH:mm:ss"));
        }
    }, [currentSelectedDate, form]);

    React.useEffect(() => {
        if (hasAuthCookie) {
            form.setValue("UserId", hasAuthCookie);
        }
    }, [hasAuthCookie, form]);

    const {
        formState: { isDirty },
    } = form;

    const formRef = React.useRef<HTMLFormElement>(null);

    console.log(hasAuthCookie);

    return (
        <div className="w-full" style={{ pointerEvents: isCalendarOpen ? "none" : "auto" }}>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                    ref={formRef}
                >
                    <input type="hidden" {...form.register("TimeStamp")} />
                    <input type="hidden" {...form.register("UserId")} />

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
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                            style={{ pointerEvents: "auto" }}
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => {
                                                    field.onChange(date);
                                                    setTimeout(() => setIsCalendarOpen(false), 175);
                                                }}
                                                fromDate={new Date()}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-2">
                        {/* SOLT Member Venue */}
                        <div className="w-full lg:w-1/2">
                            <FormLabel>SOLT Member Venue</FormLabel>
                            <FormField
                                control={form.control}
                                name="Venue"
                                render={({ field }) => {
                                    const displayLabel = field.value ? field.value : "Select venue";

                                    return (
                                        <FormItem>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            {displayLabel
                                                                ? displayLabel
                                                                : "Select venue"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[200px] p-0"
                                                    asChild
                                                    containerRef={formRef}
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search Venues..." />
                                                        <CommandEmpty>No Venue found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList>
                                                                {venues.map((venue) => (
                                                                    <CommandItem
                                                                        value={venue.value}
                                                                        key={venue.value}
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "Venue",
                                                                                venue.value
                                                                            );
                                                                            setOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                venue.value ===
                                                                                    field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {venue.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>

                        {/* Affiliate */}
                        <div className="w-full lg:w-1/2">
                            <FormLabel>Affiliate Venues</FormLabel>
                            <FormField
                                control={form.control}
                                name="AffiliateVenue"
                                render={({ field }) => {
                                    const displayLabel = field.value ? field.value : "Select venue";

                                    return (
                                        <FormItem>
                                            <Popover
                                                open={openAffiliate}
                                                onOpenChange={setOpenAffiliate}
                                            >
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between",
                                                                !field.value &&
                                                                    "text-muted-foreground"
                                                            )}
                                                        >
                                                            {displayLabel
                                                                ? displayLabel
                                                                : "Select venue"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-[200px] p-0"
                                                    asChild
                                                    containerRef={formRef}
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search Venues..." />
                                                        <CommandEmpty>No Venue found.</CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandList>
                                                                {affiliates.map((venue) => (
                                                                    <CommandItem
                                                                        value={venue.value}
                                                                        key={venue.value}
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                "AffiliateVenue",
                                                                                venue.value
                                                                            );
                                                                            setOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                venue.value ===
                                                                                    field.value
                                                                                    ? "opacity-100"
                                                                                    : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {venue.label}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandList>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* Other Venue */}
                    <div className="w-full lg:w-1/2">
                        <FormLabel>Other Venue</FormLabel>
                        <FormField
                            control={form.control}
                            name="OtherVenue"
                            render={({ field }) => (
                                <FormItem className="mb-2 lg:mb-0">
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
                                <FormItem className="flex items-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={submitting}
                                            className="mt-2 mr-1"
                                        />
                                    </FormControl>
                                    <FormLabel>Tick box if a TBA</FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                <FormItem className="flex items-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={submitting}
                                            className="mt-2 mr-1"
                                        />
                                    </FormControl>
                                    <FormLabel>Tick box if a TBA</FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col lg:flex-row gap-2">
                        <div className="w-full lg:w-1/2">
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
                        <div className="w-full lg:w-1/2">
                            <FormField
                                control={form.control}
                                name="PressContact"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Press Contact (email)</FormLabel>
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
                                <FormItem className="flex items-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={submitting}
                                            className="mt-2 mr-1"
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
                                <FormItem className="flex items-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={submitting}
                                            className="mt-2 mr-1"
                                        />
                                    </FormControl>
                                    <FormLabel>
                                        Mark this as a Season Announcement or Gala Night
                                    </FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="IsOperaDance"
                            render={({ field }) => (
                                <FormItem className="flex items-center">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={submitting}
                                            className="mt-2 mr-1"
                                        />
                                    </FormControl>
                                    <FormLabel>Mark as Opera/Dance</FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button type="submit">
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <LoadingSpinner />
                                    <span>Saving</span>
                                </div>
                            ) : (
                                <span>{isEdit ? "Save Changes" : "Create Booking"}</span>
                            )}
                        </Button>
                        {isEdit && !submitting && showNoChangesAlert && (
                            <span className="text-red-600">No changes to save.</span>
                        )}
                    </div>
                </form>
            </Form>
        </div>
    );
}
