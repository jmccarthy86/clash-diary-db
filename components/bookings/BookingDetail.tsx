import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardHeader,
    CardTitle,
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
    AlertDialogAction,
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
import { set } from "date-fns";

const BadgeVariants = {
    P: { bg: "bg-red-500", text: "text-white" },
    OPERA_DANCE: { bg: "bg-blue-500", text: "text-white" },
    GALA_NIGHT: { bg: "bg-green-500", text: "text-white" },
};

function CustomBadge({
    type,
    children,
}: {
    type: keyof typeof BadgeVariants;
    children: React.ReactNode;
}) {
    return (
        <Badge
            variant="outline"
            className={`mr-2 ${BadgeVariants[type].bg} ${BadgeVariants[type].text} px-3 py-2 rounded-md`}
        >
            {children}
        </Badge>
    );
}

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

	console.log( rowData )

    const { refreshData, callExcelMethod, yearData } = useExcel();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);

    const { UserId, P, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;
    const hiddenValues = [
        "IsSeasonGala",
        "IsOperaDance",
        "DateBkd",
        "ShowIsTitleTba",
        "VenueIsTba",
        "range",
        "Venue",
        "OtherVenue",
    ];

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

    return (
		<Card
			className="w-full pt-6"
			data-relation={UserId || undefined}
		>
			<CardContent className="grid gap-1">
				{Object.entries(otherDetails).map( (key, value) =>
					value &&
					!hiddenValues.includes(key) && (
						<div key={key} className="flex-1 space-y-1">
							<p className="font-medium leading-none">
							{unCamelCase(key)}
							</p>
							<p className="text-muted-foreground">
								{String(value)}
							</p>
						</div>
					)
				)}

				{otherDetails.Venue === "N/A" ||
				otherDetails.Venue === "" ? (
					otherDetails.OtherVenue &&
					otherDetails.OtherVenue !== "N/A" && (
						<div key="OtherVenue" className="flex-1 space-y-1">
							<p className="text-sm font-medium leading-none">
								Other Venue
							</p>
							<p className="text-sm text-muted-foreground">
								{otherDetails.OtherVenue}
							</p>
						</div>
					)
				) : (
					<div key="Venue" className="flex-1 space-y-1">
						<p className="text-sm font-medium leading-none">
							Venue
						</p>
						<p className="text-sm text-muted-foreground">
							{otherDetails.Venue}
						</p>
					</div>
				)}

				<div className="flex">
					{P &&  (
						<CustomBadge type="P">P</CustomBadge>
					)}
					{otherDetails.IsOperaDance && (
						<CustomBadge type="OPERA_DANCE">
							Opera/Dance
						</CustomBadge>
					)}
					{otherDetails.IsSeasonGala  && (
						<CustomBadge type="GALA_NIGHT">
							Season Announcement/Gala Night
						</CustomBadge>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex gap-2">
			{allowEdit && (
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
