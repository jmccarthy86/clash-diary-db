"use client";
import * as React from "react";
import { parse, isAfter, isSameDay } from "date-fns";
import { enGB } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loader";
import { deleteBooking } from "@/lib/actions/bookings";
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
import { useApp } from "@/context/AppContext";
import { toast } from "@/components/ui/use-toast";
import { CookieListItem } from "next/dist/compiled/@edge-runtime/cookies";

interface TableRowActionsProps {
    subRow: SubRowData;
}

export function TableRowActions({ subRow }: TableRowActionsProps) {
    //console.log("subRow:", subRow);
    const { refreshData } = useApp();

    const [openView, setOpenView] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [hasAuthCookie, setHasAuthCookie] = React.useState("0");

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
            await deleteBooking(subRow.range);
            await refreshData();

            toast({
                title: "Booking deleted",
                description: "The booking has been successfully deleted.",
            });

            setShowDeleteDialog(false);
        } catch (error) {
            //console.error("Error deleting booking:", error);
            toast({
                title: "Error",
                description: "There was an error deleting the booking. Please try again.",
                variant: "destructive",
            });
        }

        setIsDeleting(false);
    };

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const allowed = new Set(["https://solt.co.uk", "https://soltdigital.co.uk"]);
            if (!allowed.has(event.origin)) return;
            const { clashId } = (event.data ?? {}) as { clashId?: string | number };
            if (clashId == null) return;
            setHasAuthCookie(String(clashId)); // RowActions uses a number state
        };

        window.addEventListener("message", handleMessage);

        // Notify parent that iframe is ready
        //console.log('Iframe is ready, notifying parent');
        try {
            const ref = document.referrer ? new URL(document.referrer).origin : undefined;
            const target = ref && (ref === "https://solt.co.uk" || ref === "https://soltdigital.co.uk") ? ref : "https://solt.co.uk";
            window.parent.postMessage("iframeReady", target);
        } catch {
            window.parent.postMessage("iframeReady", "https://solt.co.uk");
        }

        // Clean up the event listener on component unmount
        return () => {
            //console.log('Cleaning up message event listener in iframe');
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    const currentSelectedDate = parse(subRow.Date, "dd/MM/yyyy", new Date(), {
        locale: enGB,
    });

    const isDev = process.env.NODE_ENV !== "production";

    const showEditOptions =
        isDev ||
        (hasAuthCookie !== "0" &&
            hasAuthCookie === String(subRow.UserId) &&
            (isAfter(currentSelectedDate, new Date()) ||
                isSameDay(currentSelectedDate, new Date())));

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
                        <DropdownMenuItem onSelect={handleViewClick}>View</DropdownMenuItem>
                        {showEditOptions && (
                            <>
                                <DropdownMenuItem onSelect={handleEditClick}>Edit</DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={handleDeleteClick}
                                    className="text-red-600"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog open={openView} onOpenChange={setOpenView}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                        <DialogDescription>{/* Some Description */}</DialogDescription>
                    </DialogHeader>
                    <BookingDetail
                        key={subRow.range}
                        rowRange={subRow.range}
                        rowData={subRow}
                        currentSelectedDate={parse(subRow.Date, "dd/MM/yyyy", new Date(), {
                            locale: enGB,
                        })}
                        allowEdit={false}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Booking</DialogTitle>
                        <DialogDescription>{/* Something here */}</DialogDescription>
                    </DialogHeader>
                    <EditBooking
                        rowRange={subRow.range}
                        currentDetail={subRow}
                        currentSelectedDate={parse(subRow.Date, "dd/MM/yyyy", new Date(), {
                            locale: enGB,
                        })}
                    />
                </DialogContent>
            </Dialog>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to delete this booking?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the booking
                            from our records.
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

            <div className="flex lg:hidden gap-2">
                <Button onClick={handleViewClick} variant="outline" size="sm">
                    View
                </Button>
                {showEditOptions && (
                    <>
                        <Button onClick={handleEditClick} variant="outline" size="sm">
                            Edit
                        </Button>
                        <Button onClick={handleDeleteClick} variant="outline" size="sm">
                            Delete
                        </Button>
                    </>
                )}
            </div>
        </>
    );
}
