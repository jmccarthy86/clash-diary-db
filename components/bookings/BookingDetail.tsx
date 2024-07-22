import React from "react";
import { isAfter, isSameDay } from "date-fns";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
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
import { unCamelCase } from "@/lib/utils";
import { useExcel } from "@/context/ExcelContext";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "../ui/loader";
import BookingBadge from "./BookingBadge";
import venues from "@/lib/venues";

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
	const [hasAuthCookie, setHasAuthCookie] = React.useState(false);

    const { UserId, P, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;
    const hiddenValues = [
        "IsSeasonGala",
        "IsOperaDance",
        "DateBkd",
        "ShowTitleIsTba",
        "VenueIsTba",
        "range",
        "Venue",
        "OtherVenue",
		"TimeStamp"
    ];

	React.useEffect(() => {
		const checkAuthCookie = () => {
		  const cookies = document.cookie.split(';');
		  const clashSyncCookie = cookies.find(cookie => cookie.trim().startsWith('clash_sync='));
		  setHasAuthCookie(!!clashSyncCookie);
		};
	  
		checkAuthCookie();
		// Set up an interval to check the cookie every 60 seconds
		const intervalId = setInterval(checkAuthCookie, 60000);
	  
		// Clean up the interval on component unmount
		return () => clearInterval(intervalId);
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
                description:
                    "There was an error deleting the booking. Please try again.",
                variant: "destructive",
            });
        }

        setIsDeleting(false);
    };

	const showEditOptions = true; //allowEdit && hasAuthCookie && (isAfter(currentSelectedDate, new Date()) || isSameDay(currentSelectedDate, new Date()));

	console.log(otherDetails.VenueIsTba);
    return (
		<Card
			className="w-full pt-6"
			data-relation={UserId || undefined}
		>
			<CardContent className="grid gap-1">

			<div key="Date" className="flex-1 space-y-1">
    <p className="font-medium leading-none">Date</p>
    <p className="text-muted-foreground">{otherDetails.Date}</p>
</div>

<div key="TitleOfShow" className="flex-1 space-y-1">
    <p className="font-medium leading-none">Title Of Show</p>
    <p className="text-muted-foreground">
        {otherDetails.TitleOfShow ? (
            otherDetails.TitleOfShow
        ) : (
            otherDetails.ShowTitleIsTba && "TBA"
        )}
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
        {otherDetails.Venue ? (
            otherDetails.Venue
        ) : otherDetails.OtherVenue ? (
            otherDetails.OtherVenue
        ) : otherDetails.VenueIsTba ? (
            "TBA"
        ) : (
            ""
        )}
    </p>
</div>


				{(!!otherDetails.IsSeasonGala || !!otherDetails.IsOperaDance || !!P || !!otherDetails.Venue) && (
				<div className="flex mt-3">
					{venues.some(venue => venue.value === otherDetails.Venue) && (
						<BookingBadge type="SOLT_MEMBER">Member</BookingBadge>
					)}
					{P && (
						<BookingBadge type="P">P</BookingBadge>
					)}
					{otherDetails.IsOperaDance && (
						<BookingBadge type="OPERA_DANCE">
							Opera/Dance
						</BookingBadge>
					)}
					{otherDetails.IsSeasonGala  && (
						<BookingBadge type="GALA_NIGHT">
							Season Announcement/Gala Night
						</BookingBadge>
					)}
				</div>
				)}
			</CardContent>
			<CardFooter className="flex gap-2">
			{/* @todo we'll need to write a userId check method, check if data is there from auth and sheet*/}
			{showEditOptions && (
				<>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm">Edit</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Booking</DialogTitle>
							<DialogDescription>
								Make changes to your booking here. Click
								save when you&apos;re done.
							</DialogDescription>
						</DialogHeader>
						<EditBooking
							rowRange={rowRange}
							currentDetail={rowData}
							currentSelectedDate={currentSelectedDate}
						/>
					</DialogContent>
				</Dialog>
				<AlertDialog
					open={isAlertDialogOpen}
					onOpenChange={setIsAlertDialogOpen}
				>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm">
							Delete
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Are you sure you want to delete this
								booking?
							</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This
								will permanently delete the booking
								from our records.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>
								Cancel
							</AlertDialogCancel>
							<Button
								onClick={handleDelete}
								disabled={isDeleting}
							>
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
