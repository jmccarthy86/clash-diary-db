"use client"
import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,  
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell, 
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { fetchExcelData, convertExcelDataToObject } from '@/lib/excelUtils'
import { TableRowActions } from "@/components/table/table-row-actions"
import { ChevronDownIcon } from "@radix-ui/react-icons"

type Booking = {
  date: string
  subRows: {
    showTitle: string
    venue: string
    pressContact: string  
  }[]
}

const columns: ColumnDef<Booking>[] = [
  {
    header: "Date",
    accessorKey: "date",
  },
  {
    id: "expand",
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        onClick={() => row.toggleExpanded()}
        className="h-8 w-8 p-0"
      >
        <ChevronDownIcon 
          className={`h-4 w-4 transition-transform duration-200 ${
            row.getIsExpanded() ? 'transform rotate-180' : ''
          }`}
        />
        <span className="sr-only">Toggle row expanded</span>
      </Button>
    ),
  },
];

const expandedColumns: ColumnDef<Booking["subRows"][number]>[] = [
  {
    header: "Show Title",
    accessorKey: "showTitle",
  },
  {
    header: "Venue",
    accessorKey: "venue",
  },
  {
    header: "Press Contact",
    accessorKey: "pressContact",
  },
  {
    header: "Actions",
    cell: ({ row }) => <TableRowActions booking={row.original} />
  }
];

export function BookingsTable() {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())
  const [data, setData] = React.useState<Booking[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  const userId = process.env.NEXT_PUBLIC_USER;
  const documentId = process.env.NEXT_PUBLIC_DOCUMENT;

  const loadData = React.useCallback(async (year) => {
    setLoading(true);

    try {
      console.log('Fetching data for year:', year);
      const { excelData, usedRange } = await fetchExcelData(userId, documentId, year, null, true);
      console.log('Fetched data:', excelData);
      console.log('Used range:', usedRange);

      const dataObject = convertExcelDataToObject({ range: usedRange, values: excelData }, year);
      console.log('Converted data object:', dataObject);

      setData(transformBookingData(dataObject));
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, documentId]);

  const memoizedLoadData = React.useMemo(() => loadData, [loadData]);

  React.useEffect(() => {
    console.log('CurrentYear changed, loading data...');
    memoizedLoadData(currentYear);
  }, [memoizedLoadData, currentYear]);

  console.log('Data state:', data);

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <React.Fragment key={row.id}>
                <TableRow>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <>
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {expandedColumns.map((column, index) => (
                                <TableHead key={index}>{flexRender(column.header, column)}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {row.original.subRows?.map((booking, index) => (
                              <TableRow key={index}>
                                {expandedColumns.map((column, columnIndex) => (
                                  <TableCell key={columnIndex}>
                                    {flexRender(
                                      column.cell ?? booking[column.accessorKey as keyof typeof booking],
                                      { row: { original: booking } } // Pass the booking data as row.original
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )) ?? (
                              <TableRow>
                                <TableCell colSpan={expandedColumns.length}>
                                  No bookings found for this date.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function transformBookingData(data: Record<string, any>): Booking[] {
  console.log('Transforming data:', data);

  const transformedData = Object.entries(data.Dates).map(([date, bookings]) => {
    console.log('Date:', date);
    console.log('Bookings:', bookings);

    return {
      date,
      subRows: Object.values(bookings).map((booking: any) => {
        console.log('Booking:', booking);
        return {
          showTitle: booking.TitleOfShow,
          venue: booking.Venue,
          pressContact: booking.PressContact,
          date: booking.date
        };
      }),
    };
  });

  console.log('Transformed data:', transformedData);
  return transformedData;
}
