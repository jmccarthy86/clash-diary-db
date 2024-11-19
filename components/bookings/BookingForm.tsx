"use client";
import * as React from "react";
import { format } from "date-fns";
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
import UKTVenues from "@/lib/uktvenues";
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
    UKTVenue: z.string().optional(),
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
    const [hasAuthCookie, setHasAuthCookie] = React.useState<number | null>(null);
    const [open, setOpen] = React.useState(false);
    const [openAffiliate, setOpenAffiliate] = React.useState(false);
    const [openUKTVenue, setOpenUKTVenue] = React.useState(false); // State for UKTVenue select

    const defaultValues = React.useMemo(() => {
        // Ensure hasAuthCookie is a valid number or undefined
        const userId = hasAuthCookie ?? undefined;

        if (initialData) {
            return {
                ...initialData,
                UserId: userId || initialData.UserId || undefined, // Ensure UserId is either number or undefined
            };
        } else {
            return {
                Day: "", // Optional field
                Date: new Date(),
                P: false,
                Venue: "",
                UKTVenue: "",
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
                UserId: userId, // Ensures UserId is either number or undefined
                TimeStamp: format(currentSelectedDate, "dd/MM/yyyy 00:00:00"),
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

    const getCookie = (name: string): string | null => {
        const cookies = new URLSearchParams(document.cookie.replace(/; /g, "&"));
        return cookies.get(name);
    };

    const checkAuthCookie = (cookies: string) => {
        const clashSyncCookie = getCookie("clash_sync");

        // If cookie exists and is valid, use it
        if (clashSyncCookie && Number(clashSyncCookie) !== 0) {
            setHasAuthCookie(Number(clashSyncCookie));
        } else {
            // If no valid cookie, fall back to parent window
            if (window.parent) {
                try {
                    const clashIdElement = window.parent.document.getElementById(
                        "clashId"
                    ) as HTMLInputElement;
                    if (clashIdElement && clashIdElement.value) {
                        setHasAuthCookie(Number(clashIdElement.value));
                    } else {
                        console.warn("No valid auth found in cookies or clashId");
                        setHasAuthCookie(null);
                    }
                } catch (error) {
                    console.error("Error accessing parent document:", error);
                    setHasAuthCookie(null);
                }
            } else {
                setHasAuthCookie(null);
            }
        }
    };

    React.useEffect(() => {
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

        return () => {
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
            form.setValue("TimeStamp", format(now, "dd/MM/yyyy HH:mm:ss"));
        }
    }, [currentSelectedDate, form]);

    React.useEffect(() => {
        if (hasAuthCookie && hasAuthCookie !== 0) {
            form.setValue("UserId", hasAuthCookie);
        }
    }, [hasAuthCookie, form]);

    const {
        formState: { isDirty },
    } = form;

    const formRef = React.useRef<HTMLFormElement>(null);

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
                                                        format(field.value, "d MMMM yyyy")
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

                    {/* Other form fields */}
                    {/* Add your form fields here, the same way as shown in the original code */}

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
