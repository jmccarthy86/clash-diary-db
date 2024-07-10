"use client"

import * as React from "react"
import { TableRowActions } from "./RowActions"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SubRowData } from "@/lib/types"
import { useExcel } from '@/context/ExcelContext'
import BookingBadge from "@/components/bookings/BookingBadge"

interface SubRowComponentProps {
    subRows: SubRowData[];
}

export function SubRowComponent({ subRows }: SubRowComponentProps) {
  const { loading, error } = useExcel();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (subRows.length < 1 ) return <span>No Bookings have been made for this date.</span>;

  console.log(subRows);
  //return <></>;

  return (
    <Table>
        <TableHeader>
            <TableRow className="hidden lg:table-row">
                <TableHead key="show-title">Show Title</TableHead>
                <TableHead key="venue">Venue</TableHead>
                <TableHead key="press-contact">Press Contact</TableHead>
                <TableHead key="actions">Actions</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
        {subRows.map((subRow, index) => (
            subRow.TitleOfShow === '' && subRow.Venue === '' && subRow.PressContact === '' ? (
                <TableRow key={index} className="bg-gray-200">
                    <TableCell colSpan={4} className="text-center">No data available</TableCell>
                </TableRow>
            ) : (
				<>
                <TableRow key={index} className="hidden lg:table-row">
                    <TableCell>{subRow.TitleOfShow}</TableCell>
                    <TableCell>{subRow.Venue}</TableCell>
                    <TableCell>{subRow.PressContact}</TableCell>

					{/*Due to our data coming from a time prior to the tool, 
					we may recieve a string, therefore we convert first with !! */}
					{/* { (!!subRow.IsSeasonGala || !!subRow.IsOperaDance || !!subRow.P) && ( 
					<TableCell>
						<div className="flex">
						{subRow.P && (
							<BookingBadge type="P">P</BookingBadge>
						)}
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
					</TableCell>
					)} */}

                    <TableCell>
                        <TableRowActions subRow={subRow} />
                    </TableCell>
                </TableRow>
				<TableRow key={`${index}-mobile`} className="lg:hidden">
					<TableCell>
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
				{subRow.Venue === "" ? (
					subRow.OtherVenue &&
					subRow.OtherVenue !== "" && (
						<div key="OtherVenue" className="flex-1 space-y-1 mb-2">
							<p className="font-medium leading-none">
								Other Venue
							</p>
							<p className="text-muted-foreground">
								{subRow.OtherVenue}
							</p>
						</div>
					)
				) : (
					<div key="Venue" className="flex-1 space-y-1 mb-2">
						<p className="font-medium leading-none">
							Venue
						</p>
						<p className="text-muted-foreground">
							{subRow.Venue}
						</p>
					</div>
				)}
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
					{subRow.P && (
						<BookingBadge type="P">P</BookingBadge>
					)}
					{subRow.IsOperaDance && (
						<BookingBadge type="OPERA_DANCE">
							Opera/Dance
						</BookingBadge>
					)}
					{subRow.IsSeasonGala  && (
						<BookingBadge type="GALA_NIGHT">
							Season Announcement/Gala Night
						</BookingBadge>
					)}
					</div>
					<TableRowActions subRow={subRow} />
					</TableCell>
				</TableRow>
				</>
            )
        ))}
        </TableBody>
    </Table>
  )
};

export default SubRowComponent;