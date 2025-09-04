import React from "react";
import { isAfter, isSameDay } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditBooking from "@/components/bookings/EditBooking";
import { useApp } from "@/context/AppContext";
import { deleteBooking } from "@/lib/actions/bookings";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "../ui/loader";
import BookingBadge from "./BookingBadge";
import venues from "@/lib/venues";
import affiliates from "@/lib/affiliates";
import uktVenues from "@/lib/uktvenues";

interface BookingDetailProps {
    rowRange: string;
    rowData: any;
    currentSelectedDate: Date;
    allowEdit: boolean;
}

export default function BookingDetail({
    rowRange,
    rowData,
    currentSelectedDate,
    allowEdit,
}: BookingDetailProps) {
    const { refreshData } = useApp();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
    const [hasAuthCookie, setHasAuthCookie] = React.useState<string>("0");

    const { userId, p, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;

    React.useEffect(() => {
        // Listen for message from parent
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== "https://solt.co.uk") return;
            const { clashId } = (event.data ?? {}) as { clashId?: string | number };
            if (clashId == null) return;
            setHasAuthCookie(String(clashId));
        };

        window.addEventListener("message", handleMessage);

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await deleteBooking(rowRange);
            await refreshData();

            toast({
                title: "Booking deleted successfully",
                description: "The booking has been removed from the calendar.",
            });
        } catch (error) {
            console.error("Error deleting booking:", error);

            toast({
                title: "Error deleting booking",
                description: "There was an error deleting the booking. Please try again.",
                variant: "destructive",
            });
        }

        setIsDeleting(false);
    };

    const isDev = process.env.NODE_ENV !== "production";

    const showEditOptions =
        isDev ||
        (hasAuthCookie !== "0" &&
            hasAuthCookie === userId &&
            (isAfter(currentSelectedDate, new Date()) ||
                isSameDay(currentSelectedDate, new Date())));

    return (
        <Card className="w-full pt-6" data-relation={userId || undefined}>
            <CardContent className="grid gap-1">
                <div key="Date" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Date</p>
                    <p className="text-muted-foreground">{otherDetails.Date}</p>
                </div>

                <div key="TitleOfShow" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Title Of Show</p>
                    <p className="text-muted-foreground">
                        {otherDetails.titleOfShow
                            ? otherDetails.titleOfShow
                            : otherDetails.showTitleIsTba && "TBA"}
                    </p>
                </div>

                <div key="Producer" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Producer</p>
                    <p className="text-muted-foreground">{otherDetails.producer}</p>
                </div>

                <div key="PressContact" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Press Contact</p>
                    <p className="text-muted-foreground">{otherDetails.pressContact}</p>
                </div>

                <div key="OtherVenue" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Venue</p>
                    <p className="text-muted-foreground">
                        {otherDetails.venue
                            ? otherDetails.venue
                            : otherDetails.otherVenue
                              ? otherDetails.otherVenue
                              : otherDetails.affiliateVenue
                                ? otherDetails.affiliateVenue
                                : otherDetails.uktVenue
                                  ? otherDetails.uktVenue
                                  : otherDetails.venueIsTba
                                    ? "TBA"
                                    : ""}
                    </p>
                </div>

                <div key="Badges" className="flex-1 space-y-1">
                    <div className="flex flex-wrap mt-3">
                        {/* <p>{otherDetails.isSeasonGala}</p> */}
                        {affiliates.some((affiliate) => affiliate.value === otherDetails.venue) && (
                            <BookingBadge type="AFFILATE_VENUE">Affiliate</BookingBadge>
                        )}

                        {venues.some((venue) => venue.value === otherDetails.venue) && (
                            <BookingBadge type="SOLT_MEMBER">SOLT Member</BookingBadge>
                        )}

                        {uktVenues.some((uktVenue) => uktVenue.value === otherDetails.venue) && (
                            <BookingBadge type="UKT_VENUE">UKT Member</BookingBadge>
                        )}

                        {Boolean(p) && <BookingBadge type="P">P</BookingBadge>}

                        {Boolean(otherDetails.isOperaDance) && (
                            <BookingBadge type="OPERA_DANCE">Opera/Dance</BookingBadge>
                        )}

                        {Boolean(otherDetails.isSeasonGala) && (
                            <BookingBadge type="GALA_NIGHT">
                                Season Announcement/Gala Night
                            </BookingBadge>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                {showEditOptions && (
                    <>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Booking</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your booking here. Click save when
                                        you&apos;re done.
                                    </DialogDescription>
                                </DialogHeader>
                                <EditBooking
                                    rowRange={rowRange}
                                    currentDetail={rowData}
                                    currentSelectedDate={currentSelectedDate}
                                />
                            </DialogContent>
                        </Dialog>
                        <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Are you sure you want to delete this booking?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete
                                        the booking from our records.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <Button onClick={handleDelete} disabled={isDeleting}>
                                        {isDeleting ? (
                                            <div className="flex items-center gap-2">
                                                <LoadingSpinner />
                                                <span>Deleting</span>
                                            </div>
                                        ) : (
                                            <span>Delete</span>
                                        )}
                                    </Button>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
