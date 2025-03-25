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
import { useExcel } from "@/context/ExcelContext";
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
                    <TableHead key="show-title">Show Title</TableHead>
                    <TableHead key="venue">Venue</TableHead>
                    <TableHead key="press-contact">Press Contact</TableHead>
                    <TableHead key="actions">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {subRows.map((subRow, index) =>
                    subRow.TitleOfShow === "" &&
                    subRow.Venue === "" &&
                    subRow.PressContact === "" ? (
                        <TableRow key={`no-data-${index}`} className="bg-gray-200">
                            <TableCell key="subrow-no-data" colSpan={4} className="text-center">
                                No data available
                            </TableCell>
                        </TableRow>
                    ) : (
                        <React.Fragment key={`group-${index}`}>
                            <TableRow key={`desktop-${index}`} className="hidden lg:table-row">
                                <TableCell key={`${index}-${subRow.TitleOfShow}`}>
                                    {subRow.TitleOfShow}
                                </TableCell>
                                <TableCell key={`${index}-${subRow.Venue}`}>
                                    {subRow.Venue
                                        ? subRow.Venue
                                        : subRow.OtherVenue
                                        ? subRow.OtherVenue
                                        : subRow.AffiliateVenue
                                        ? subRow.AffiliateVenue
                                        : subRow.UKTVenue
                                        ? subRow.UKTVenue
                                        : subRow.VenueIsTba
                                        ? "TBA"
                                        : ""}
                                </TableCell>
                                <TableCell key={`${index}-${subRow.PressContact}`}>
                                    {subRow.PressContact}
                                </TableCell>
                                <TableCell key={`${index}-aciotn`}>
                                    <TableRowActions subRow={subRow} />
                                </TableCell>
                            </TableRow>
                            <TableRow key={`${index}-mobile`} className="lg:hidden">
                                <TableCell key={`${index}-mobile-details`}>
                                    {subRow.TitleOfShow && (
                                        <div key="TitleOfShow" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Title Of Show
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.TitleOfShow}
                                            </p>
                                        </div>
                                    )}
                                    {subRow.Venue?.trim() ? (
                                        <div key="Venue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Venue</p>
                                            <p className="text-muted-foreground">{subRow.Venue}</p>
                                        </div>
                                    ) : subRow.UKTVenue?.trim() ? (
                                        <div key="UKTVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">UKT Venue</p>
                                            <p className="text-muted-foreground">
                                                {subRow.UKTVenue}
                                            </p>
                                        </div>
                                    ) : subRow.OtherVenue?.trim() ? (
                                        <div key="OtherVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Other Venue</p>
                                            <p className="text-muted-foreground">
                                                {subRow.OtherVenue}
                                            </p>
                                        </div>
                                    ) : subRow.AffiliateVenue?.trim() ? (
                                        <div key="AffiliateVenue" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Affiliate Venue
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.AffiliateVenue}
                                            </p>
                                        </div>
                                    ) : subRow.VenueIsTba ? (
                                        <div key="TBA" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">Venue</p>
                                            <p className="text-muted-foreground">TBA</p>
                                        </div>
                                    ) : null}

                                    {subRow.PressContact && (
                                        <div key="PressContact" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Press Contact
                                            </p>
                                            <p className="text-muted-foreground">
                                                {subRow.PressContact}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mb-3">
                                        {subRow.P && <BookingBadge type="P">P</BookingBadge>}
                                        {subRow.IsOperaDance && (
                                            <BookingBadge type="OPERA_DANCE">
                                                Opera/Dance
                                            </BookingBadge>
                                        )}
                                        {subRow.IsSeasonGala && (
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
