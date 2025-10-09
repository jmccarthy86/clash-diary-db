"use client";

import * as React from "react";
import { TableRowActions } from "./RowActions";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SubRowData } from "@/lib/types";
import BookingBadge from "@/components/bookings/BookingBadge";

interface SubRowComponentProps {
    subRows: SubRowData[];
}

export function SubRowComponent({ subRows }: SubRowComponentProps) {
    if (subRows.length < 1) return <span>No Bookings have been made for this date.</span>;
    return (
        <Table key={subRows[0].Date}>
            <TableHeader>
                <TableRow className="hidden lg:table-row">
                    <TableHead key="show-title" className="h-10 px-3 py-2 text-sm">
                        Show Title
                    </TableHead>
                    <TableHead key="venue" className="h-10 px-3 py-2 text-sm">
                        Venue
                    </TableHead>
                    <TableHead key="press-contact" className="h-10 px-3 py-2 text-sm">
                        Press Contact
                    </TableHead>
                    <TableHead key="actions" className="h-10 px-3 py-2 text-sm">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {subRows.map((subRow, index) =>
                    subRow.titleOfShow === "" &&
                    subRow.venue === "" &&
                    subRow.pressContact === "" ? (
                        <TableRow key={`no-data-${index}`} className="bg-gray-200">
                            <TableCell
                                key="subrow-no-data"
                                colSpan={4}
                                className="px-3 py-4 text-center text-sm"
                            >
                                No data available
                            </TableCell>
                        </TableRow>
                    ) : (
                        <React.Fragment key={`group-${index}`}>
                            <TableRow key={`desktop-${index}`} className="hidden lg:table-row">
                                <TableCell
                                    key={`${index}-${subRow.titleOfShow}`}
                                    className="px-3 py-2 text-sm"
                                >
                                    {subRow.titleOfShow}
                                </TableCell>
                                <TableCell
                                    key={`${index}-${subRow.venue}`}
                                    className="px-3 py-2 text-sm"
                                >
                                    {subRow.venue
                                        ? subRow.venue
                                        : subRow.otherVenue
                                        ? subRow.otherVenue
                                        : subRow.affiliateVenue
                                        ? subRow.affiliateVenue
                                        : subRow.uktVenue
                                        ? subRow.uktVenue
                                        : subRow.venueIsTba
                                        ? "TBA"
                                        : ""}
                                </TableCell>
                                <TableCell
                                    key={`${index}-${subRow.pressContact}`}
                                    className="px-3 py-2 text-sm"
                                >
                                    {subRow.pressContact}
                                </TableCell>
                                <TableCell key={`${index}-aciotn`} className="px-3 py-2 text-sm">
                                    <TableRowActions subRow={subRow} />
                                </TableCell>
                            </TableRow>
                            <TableRow key={`${index}-mobile`} className="lg:hidden">
                                <TableCell key={`${index}-mobile-details`} className="px-3 py-3">
                                    {subRow.titleOfShow && (
                                        <div key="TitleOfShow" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Title Of Show
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.titleOfShow}
                                            </p>
                                        </div>
                                    )}
                                    {subRow.venue ? (
                                        <div key="Venue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Venue</p>
                                            <p className="text-muted-foreground">{subRow.venue}</p>
                                        </div>
                                    ) : subRow.uktVenue ? (
                                        <div key="UKTVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">UKT Venue</p>
                                            <p className="text-muted-foreground">
                                                {subRow.uktVenue}
                                            </p>
                                        </div>
                                    ) : subRow.otherVenue ? (
                                        <div key="OtherVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Other Venue</p>
                                            <p className="text-muted-foreground">
                                                {subRow.otherVenue}
                                            </p>
                                        </div>
                                    ) : subRow.affiliateVenue ? (
                                        <div key="AffiliateVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Affiliate Venue
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.affiliateVenue}
                                            </p>
                                        </div>
                                    ) : subRow.venueIsTba ? (
                                        <div key="TBA" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Venue</p>
                                            <p className="text-muted-foreground">TBA</p>
                                        </div>
                                    ) : null}

                                    {subRow.pressContact && (
                                        <div key="PressContact" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Press Contact
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.pressContact}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mb-3">
                                        {Boolean(subRow.p) && <BookingBadge type="P">P</BookingBadge>}
                                        {Boolean(subRow.isOperaDance) && (
                                            <BookingBadge type="OPERA_DANCE">
                                                Opera/Dance
                                            </BookingBadge>
                                        )}
                                        {Boolean(subRow.isSeasonGala) && (
                                            <BookingBadge type="GALA_NIGHT">
                                                Season Announcement/Gala Night
                                            </BookingBadge>
                                        )}
                                    </div>
                                    <TableRowActions subRow={subRow} />
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    )
                )}
            </TableBody>
        </Table>
    );
}

export default SubRowComponent;
