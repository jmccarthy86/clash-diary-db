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
import {
    resolveTitleOfShow,
    resolveVenueDisplay,
    coalesceString,
    toBooleanLike,
} from "@/lib/utils";

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
    const debugAuth =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("debugAuth");

    const { p, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;
    const userId = coalesceString((rowData as any).userId, (rowData as any).UserId);
    const normalizedTitle = coalesceString(
        otherDetails.titleOfShow,
        otherDetails.TitleOfShow
    );
    const displayTitleOfShow = resolveTitleOfShow(
        normalizedTitle,
        toBooleanLike(otherDetails.showTitleIsTba ?? otherDetails.ShowTitleIsTba)
    );
    const normalizedVenue = coalesceString(otherDetails.venue, otherDetails.Venue);
    const displayVenue = resolveVenueDisplay({
        venue: normalizedVenue,
        otherVenue: coalesceString(otherDetails.otherVenue, otherDetails.OtherVenue),
        affiliateVenue: coalesceString(
            otherDetails.affiliateVenue,
            otherDetails.AffiliateVenue
        ),
        uktVenue: coalesceString(otherDetails.uktVenue, otherDetails.UKTVenue),
        venueIsTba: toBooleanLike(otherDetails.venueIsTba ?? otherDetails.VenueIsTba),
        soltMemberNonSoltVenue: toBooleanLike(
            (otherDetails as any).soltMemberNonSoltVenue ??
                (otherDetails as any).SoltMemberNonSoltVenue ??
                (otherDetails as any).solt_member_non_solt_venue
        ),
    });
    const normalizedPressContact = coalesceString(
        otherDetails.pressContact,
        otherDetails.PressContact
    );
    const isSoltMemberNonSoltVenue = toBooleanLike(
        (otherDetails as any).soltMemberNonSoltVenue ??
            (otherDetails as any).SoltMemberNonSoltVenue ??
            (otherDetails as any).solt_member_non_solt_venue
    );

    React.useEffect(() => {
        // Listen for message from parent
        const handleMessage = (event: MessageEvent) => {
            const allowed = new Set([
                "https://solt.co.uk",
                "https://soltdigital.co.uk",
                "https://soltukt.test",
            ]);
            if (!allowed.has(event.origin)) return;
            if (debugAuth) {
                console.log("[FND auth] BookingDetail message", {
                    origin: event.origin,
                    data: event.data,
                    referrer: document.referrer,
                });
            }
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

    React.useEffect(() => {
        if (!debugAuth) return;
        console.log("[FND auth] BookingDetail state", {
            hasAuthCookie,
            userId,
            showEditOptions,
            isDev,
            currentSelectedDate: currentSelectedDate?.toISOString?.() ?? null,
        });
    }, [debugAuth, hasAuthCookie, userId, showEditOptions, isDev, currentSelectedDate]);

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
                        {displayTitleOfShow}
                    </p>
                </div>

                <div key="Producer" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Producer</p>
                    <p className="text-muted-foreground">
                        {coalesceString(otherDetails.producer, otherDetails.Producer)}
                    </p>
                </div>

                <div key="PressContact" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Press Contact</p>
                    <p className="text-muted-foreground">{normalizedPressContact}</p>
                </div>

                <div key="OtherVenue" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Venue</p>
                    <p className="text-muted-foreground">
                        {displayVenue}
                    </p>
                </div>

                <div key="Badges" className="flex-1 space-y-1">
                    <div className="flex flex-wrap mt-3">
                        {/* <p>{otherDetails.isSeasonGala}</p> */}
                        {(isSoltMemberNonSoltVenue ||
                            venues.some((venue) => venue.value === normalizedVenue)) && (
                            <BookingBadge type="SOLT_MEMBER">SOLT Member</BookingBadge>
                        )}
                        {affiliates.some((affiliate) => affiliate.value === normalizedVenue) && (
                            <BookingBadge type="AFFILATE_VENUE">Affiliate</BookingBadge>
                        )}

                        {uktVenues.some((uktVenue) => uktVenue.value === normalizedVenue) && (
                            <BookingBadge type="UKT_VENUE">UKT Member</BookingBadge>
                        )}

                        {toBooleanLike(p ?? otherDetails.p ?? otherDetails.P) && (
                            <BookingBadge type="P">P</BookingBadge>
                        )}

                        {toBooleanLike(
                            otherDetails.isOperaDance ?? otherDetails.IsOperaDance
                        ) && (
                            <BookingBadge type="OPERA_DANCE">Opera/Dance</BookingBadge>
                        )}

                        {toBooleanLike(
                            otherDetails.isSeasonGala ?? otherDetails.IsSeasonGala
                        ) && (
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
