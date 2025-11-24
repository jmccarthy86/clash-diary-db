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
import venues from "@/lib/venues";
import affiliates from "@/lib/affiliates";
import uktVenues from "@/lib/uktvenues";
import {
    resolveTitleOfShow,
    resolveVenueDisplay,
    coalesceString,
    toBooleanLike,
} from "@/lib/utils";

interface SubRowComponentProps {
    subRows: SubRowData[];
}

export function SubRowComponent({ subRows }: SubRowComponentProps) {
    if (subRows.length < 1) return <span>No Bookings have been made for this date.</span>;
    return (
        <Table key={subRows[0].Date}>
            <TableHeader>
                <TableRow className="hidden lg:table-row">
                    <TableHead key="show-title" className="h-10 px-3 py-2 text-xs">
                        Show Title
                    </TableHead>
                    <TableHead key="venue" className="h-10 px-3 py-2 text-xs">
                        Venue
                    </TableHead>
                    <TableHead key="press-contact" className="h-10 px-3 py-2 text-xs">
                        Press Contact
                    </TableHead>
                    <TableHead key="badges" className="h-10 px-3 py-2 text-xs">
                        Tags
                    </TableHead>
                    <TableHead key="actions" className="h-10 px-3 py-2 text-xs">
                        Actions
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {subRows.map((subRow, index) => {
                    const venueValue = coalesceString(subRow.venue, (subRow as any).Venue).trim();
                    const showAffiliateBadge = affiliates.some(
                        (affiliate) => affiliate.value === venueValue
                    );
                    const showSoltBadge = venues.some((venue) => venue.value === venueValue);
                    const showUktBadge = uktVenues.some((uktVenue) => uktVenue.value === venueValue);
                    const showPBadge = toBooleanLike(subRow.p ?? (subRow as any).P);
                    const showSoltNonSoltBadge = toBooleanLike(
                        subRow.soltMemberNonSoltVenue ??
                            (subRow as any).SoltMemberNonSoltVenue ??
                            (subRow as any).solt_member_non_solt_venue
                    );
                    const showOperaBadge = toBooleanLike(
                        subRow.isOperaDance ?? (subRow as any).IsOperaDance
                    );
                    const showGalaBadge = toBooleanLike(
                        subRow.isSeasonGala ?? (subRow as any).IsSeasonGala
                    );
                    const showAnyBadge =
                        showAffiliateBadge ||
                        showSoltBadge ||
                        showSoltNonSoltBadge ||
                        showUktBadge ||
                        showPBadge ||
                        showOperaBadge ||
                        showGalaBadge;
                    const showTitleIsTba = toBooleanLike(
                        subRow.showTitleIsTba ?? (subRow as any).ShowTitleIsTba
                    );
                    const displayTitle = resolveTitleOfShow(
                        coalesceString(subRow.titleOfShow, (subRow as any).TitleOfShow),
                        showTitleIsTba
                    );
                    const venueIsTba = toBooleanLike(
                        subRow.venueIsTba ?? (subRow as any).VenueIsTba
                    );
                    const displayVenue = resolveVenueDisplay({
                        venue: venueValue,
                        otherVenue: coalesceString(subRow.otherVenue, (subRow as any).OtherVenue),
                        affiliateVenue: coalesceString(
                            subRow.affiliateVenue,
                            (subRow as any).AffiliateVenue
                        ),
                        uktVenue: coalesceString(subRow.uktVenue, (subRow as any).UKTVenue),
                        venueIsTba,
                    });
                    const pressContact = coalesceString(
                        subRow.pressContact,
                        (subRow as any).PressContact
                    ).trim();
                    const rowIsEmpty = !displayTitle && !displayVenue && !pressContact;

                    if (rowIsEmpty) {
                        return (
                            <TableRow key={`no-data-${index}`} className="bg-gray-200">
                                <TableCell
                                    key="subrow-no-data"
                                    colSpan={5}
                                    className="px-3 py-4 text-center text-xs"
                                >
                                    No data available
                                </TableCell>
                            </TableRow>
                        );
                    }

                    return (
                        <React.Fragment key={`group-${index}`}>
                            <TableRow key={`desktop-${index}`} className="hidden lg:table-row">
                                <TableCell
                                    key={`${index}-${displayTitle || index}`}
                                    className="px-3 py-2 text-xs"
                                >
                                    <div>{displayTitle}</div>
                                </TableCell>
                                <TableCell
                                    key={`${index}-${displayVenue || "venue"}`}
                                    className="px-3 py-2 text-xs"
                                >
                                    {displayVenue}
                                </TableCell>
                                <TableCell
                                    key={`${index}-${pressContact || "press"}`}
                                    className="px-3 py-2 text-xs"
                                >
                                    {pressContact}
                                </TableCell>
                                <TableCell key={`${index}-badges`} className="px-3 py-2 text-xs">
                                    {showAnyBadge && (
                                        <div className="flex flex-wrap gap-2">
                                            {showSoltNonSoltBadge && (
                                                <BookingBadge type="SOLT_MEMBER_NON_SOLT">
                                                    SOLT Member (non-SOLT venue)
                                                </BookingBadge>
                                            )}
                                            {showAffiliateBadge && (
                                                <BookingBadge type="AFFILATE_VENUE">
                                                    Affiliate
                                                </BookingBadge>
                                            )}
                                            {showSoltBadge && (
                                                <BookingBadge type="SOLT_MEMBER">
                                                    SOLT Member
                                                </BookingBadge>
                                            )}
                                            {showUktBadge && (
                                                <BookingBadge type="UKT_VENUE">
                                                    UKT Member
                                                </BookingBadge>
                                            )}
                                            {showPBadge && <BookingBadge type="P">P</BookingBadge>}
                                            {showOperaBadge && (
                                                <BookingBadge type="OPERA_DANCE">
                                                    Opera/Dance
                                                </BookingBadge>
                                            )}
                                            {showGalaBadge && (
                                                <BookingBadge type="GALA_NIGHT">
                                                    Season Announcement/Gala Night
                                                </BookingBadge>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell key={`${index}-aciotn`} className="px-3 py-2 text-xs">
                                    <TableRowActions subRow={subRow} />
                                </TableCell>
                            </TableRow>
                            <TableRow key={`${index}-mobile`} className="lg:hidden">
                                <TableCell key={`${index}-mobile-details`} className="px-3 py-3">
                                    {displayTitle && (
                                        <div key="TitleOfShow" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Title Of Show
                                            </p>
                                            <p className="text-muted-foreground">
                                                {displayTitle}
                                            </p>
                                        </div>
                                    )}
                                    <div key="Venue" className="flex-1 space-y-1 mb-2">
                                        <p className="font-medium leading-none">Venue</p>
                                        <p className="text-muted-foreground">
                                            {displayVenue || "—"}
                                        </p>
                                    </div>

                                    {pressContact && (
                                        <div key="PressContact" className="flex-1 space-y-1 mb-2">
                                            <p className="font-medium leading-none">
                                                Press Contact
                                            </p>
                                            <p className="text-muted-foreground">
                                                {pressContact}
                                            </p>
                                        </div>
                                    )}

                                    {showAnyBadge && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {showSoltNonSoltBadge && (
                                                <BookingBadge type="SOLT_MEMBER_NON_SOLT">
                                                    SOLT Member (non-SOLT venue)
                                                </BookingBadge>
                                            )}
                                            {showAffiliateBadge && (
                                                <BookingBadge type="AFFILATE_VENUE">
                                                    Affiliate
                                                </BookingBadge>
                                            )}
                                            {showSoltBadge && (
                                                <BookingBadge type="SOLT_MEMBER">
                                                    SOLT Member
                                                </BookingBadge>
                                            )}
                                            {showUktBadge && (
                                                <BookingBadge type="UKT_VENUE">
                                                    UKT Member
                                                </BookingBadge>
                                            )}
                                            {showPBadge && <BookingBadge type="P">P</BookingBadge>}
                                            {showOperaBadge && (
                                                <BookingBadge type="OPERA_DANCE">
                                                    Opera/Dance
                                                </BookingBadge>
                                            )}
                                            {showGalaBadge && (
                                                <BookingBadge type="GALA_NIGHT">
                                                    Season Announcement/Gala Night
                                                </BookingBadge>
                                            )}
                                        </div>
                                    )}
                                    <TableRowActions subRow={subRow} />
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export default SubRowComponent;
