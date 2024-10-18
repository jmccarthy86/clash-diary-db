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
import { useExcel } from "@/context/ExcelContext";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "../ui/loader";
import BookingBadge from "./BookingBadge";
import venues from "@/lib/venues";
import affiliates from "@/lib/affiliates";
import UKTVenues from "@/lib/uktvenues";

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
    const { refreshData, callExcelMethod, yearData } = useExcel();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
    const [hasAuthCookie, setHasAuthCookie] = React.useState(0);

    const { UserId, P, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;

    React.useEffect(() => {
        const checkAuthCookie = (cookies: string) => {
            const cookieArray = cookies.split(";");
            const clashSyncCookie = cookieArray.find((cookie) =>
                cookie.trim().startsWith("clash_sync=")
            );
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
        window.parent.postMessage("iframeReady", "https://solt.co.uk");

        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await callExcelMethod("deleteRow", rowRange, yearData!.Range);
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

    const showEditOptions =
        hasAuthCookie !== 0 &&
        hasAuthCookie === Number(UserId) &&
        (isAfter(currentSelectedDate, new Date()) || isSameDay(currentSelectedDate, new Date()));

    console.log(otherDetails);

    return (
        <Card className="w-full pt-6" data-relation={UserId || undefined}>
            <CardContent className="grid gap-1">
                <div key="Date" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Date</p>
                    <p className="text-muted-foreground">{otherDetails.Date}</p>
                </div>

                <div key="TitleOfShow" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Title Of Show</p>
                    <p className="text-muted-foreground">
                        {otherDetails.TitleOfShow
                            ? otherDetails.TitleOfShow
                            : otherDetails.ShowTitleIsTba && "TBA"}
                    </p>
                </div>

                <div key="Producer" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Producer</p>
                    <p className="text-muted-foreground">{otherDetails.Producer}</p>
                </div>

                <div key="PressContact" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Press Contact</p>
                    <p className="text-muted-foreground">{otherDetails.PressContact}</p>
                </div>

                <div key="OtherVenue" className="flex-1 space-y-1">
                    <p className="font-medium leading-none">Venue</p>
                    <p className="text-muted-foreground">
                        {otherDetails.Venue
                            ? otherDetails.Venue
                            : otherDetails.OtherVenue
                            ? otherDetails.OtherVenue
                            : otherDetails.AffiliateVenue
                            ? otherDetails.AffiliateVenue
                            : otherDetails.UKTVenue
                            ? otherDetails.UKTVenue
                            : otherDetails.VenueIsTba
                            ? "TBA"
                            : ""}
                    </p>
                </div>

                {(!!otherDetails.IsSeasonGala ||
                    !!otherDetails.IsOperaDance ||
                    !!P ||
                    !!otherDetails.Venue ||
                    UKTVenues.some((uktVenue) => uktVenue.value === otherDetails.UKTVenue)) && (
                    <div className="flex flex-wrap mt-3">
                        {affiliates.some(
                            (affiliate) => affiliate.value === otherDetails.AffiliateVenue
                        ) && <BookingBadge type="AFFILATE_VENUE">Affiliate</BookingBadge>}
                        {venues.some((venue) => venue.value === otherDetails.Venue) && (
                            <BookingBadge type="SOLT_MEMBER">SOLT Member</BookingBadge>
                        )}
                        {P && <BookingBadge type="P">P</BookingBadge>}
                        {otherDetails.IsOperaDance && (
                            <BookingBadge type="OPERA_DANCE">Opera/Dance</BookingBadge>
                        )}
                        {otherDetails.IsSeasonGala && (
                            <BookingBadge type="GALA_NIGHT">
                                Season Announcement/Gala Night
                            </BookingBadge>
                        )}
                        {UKTVenues.some((uktVenue) => uktVenue.value === otherDetails.UKTVenue) && (
                            <BookingBadge type="UKT_VENUE">UKT Member</BookingBadge>
                        )}
                    </div>
                )}
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
