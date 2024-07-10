"use client"

import * as React from "react"
import { parse, format, parseISO, compareAsc } from "date-fns"
import { enGB } from "date-fns/locale";
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, ChevronUp, CalendarCheck } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { parseDate } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import CreateBooking from "../bookings/CreateBooking"
//import { useExcel } from '@/context/ExcelContext'

type SubRow = Record<string, string | number>;

export type Booking = {
  date: string
  subRows: SubRow[]
}

export const columnsConfig = (): ColumnDef<Booking>[] => [
  {
    accessorKey: 'date',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {

		const formattedDate = format( parse( row.getValue("date"), 'dd/MM/yyyy', new Date() ), 'do MMMM yyyy' );
		return (

      		<div className="flex items-center gap-1">
				<div className="leading-4">{formattedDate}</div>
				{row.original.subRows.length > 0 && (
					<CalendarCheck className="text-slate-500 h-3 w-3 align-top" />
				)}
			</div>
		)
  	},
    filterFn: (row, id, value: { from: Date, to: Date } | undefined) => {
      if (!value?.from || !value?.to) return true;
      const dateStr = row.getValue(id) as string;
      const date = parseDate(dateStr);
      return date >= value.from && date <= value.to;
    },
    sortingFn: (rowA, rowB, columnId) => {
		const dateA = parse(rowA.getValue(columnId), 'dd/MM/yyyy', new Date());
		const dateB = parse(rowB.getValue(columnId), 'dd/MM/yyyy', new Date());
		return compareAsc(dateA, dateB);
	},
  },
  {
    id: 'expand',
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
      >
        {row.getIsExpanded() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
    ),
  },
  {
    id: 'bookNow',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Book Now
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Book Now</DialogTitle>
              <DialogDescription>
                Complete your booking for {row.getValue("date")}.
              </DialogDescription>
            </DialogHeader>
            <CreateBooking currentSelectedDate={parse(row.getValue("date"), "dd/MM/yyyy", new Date(), { locale: enGB })} />
          </DialogContent>
        </Dialog>
      )
    },
  },
];