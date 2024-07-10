"use client";
import * as React from "react";
import { parse } from "date-fns"
import { enGB } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loader"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
} from "@/components/ui/alert-dialog";

import BookingDetail from "@/components/bookings/BookingDetail";
import EditBooking from "@/components/bookings/EditBooking";
import { SubRowData } from "@/lib/types";
import { useExcel } from "@/context/ExcelContext";
import { toast } from "@/components/ui/use-toast";

interface TableRowActionsProps {
    subRow: SubRowData;
}

export function TableRowActions({subRow}) {
	console.log("subRow:", subRow);
    const { refreshData, yearData, callExcelMethod } = useExcel();

    const [openView, setOpenView] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleViewClick = () => {
        setIsOpen(false);
        setOpenView(true);
    };

    const handleEditClick = () => {
        setIsOpen(false);
        setOpenEdit(true);
    };

    const handleDeleteClick = () => {
        setIsOpen(false);
        setShowDeleteDialog(true);
    };

    const handleDelete = async () => {

		setIsDeleting(true);

        try {

            await callExcelMethod("deleteRow", subRow.range, yearData?.Range);
            await refreshData();

            toast({
                title: "Booking deleted",
                description: "The booking has been successfully deleted.",
            });

            setShowDeleteDialog(false);

        } catch (error) {

            console.error("Error deleting booking:", error);
            toast({
                title: "Error",
                description:
                    "There was an error deleting the booking. Please try again.",
                variant: "destructive",
            });

        }

        setIsDeleting(false);

    };

    return (
		<>
        <div className="hidden lg:block">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleViewClick}>
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleEditClick}>
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={handleDeleteClick}
                        className="text-red-600"
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
		</div>

		<Dialog open={openView} onOpenChange={setOpenView}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Booking Details</DialogTitle>
					<DialogDescription>
						{/* Some Description */}
					</DialogDescription>
				</DialogHeader>
				<BookingDetail
					key={subRow.Range}
					rowRange={subRow.Range}
					rowData={subRow}
					currentSelectedDate={subRow.Date}
					allowEdit={false}
				/>
			</DialogContent>
		</Dialog>
		<Dialog open={openEdit} onOpenChange={setOpenEdit}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Booking</DialogTitle>
					<DialogDescription>
						{/* Something here */}
					</DialogDescription>
				</DialogHeader>
				<EditBooking
					rowRange={subRow.range}
					currentDetail={subRow}
					currentSelectedDate={parse(subRow.Date, "dd/MM/yyyy", new Date(), { locale: enGB })}
				/>
			</DialogContent>
		</Dialog>
		<AlertDialog
			open={showDeleteDialog}
			onOpenChange={setShowDeleteDialog}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Are you sure you want to delete this booking?
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This
						will permanently delete the booking
						from our records.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
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

		<div className="flex lg:hidden gap-2">
			<Button onClick={handleViewClick} variant="outline" size="sm">View</Button>
			<Button onClick={handleEditClick} variant="outline" size="sm">Edit</Button>
			<Button onClick={handleDeleteClick} variant="outline" size="sm">Delete</Button>
		</div>
		</>
    );
}
