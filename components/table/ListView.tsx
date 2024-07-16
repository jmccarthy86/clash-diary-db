"use client"

import * as React from 'react';
import TableSkeleton from './Skeleton';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getPaginationRowModel
} from '@tanstack/react-table';
import SubRowComponent from './SubRow';
import DatePickerWithRange from "./FilterDateRange";
import { DataTablePagination } from './Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ColumnDef } from "@tanstack/react-table"
import { Booking, RequestData } from '@/lib/types'
import { Button } from "../ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { transformData, createYearCalendarWithData } from '@/lib/utils'
import { columnsConfig } from '@/components/table/ColumnsConfig'
import { useExcel } from '@/context/ExcelContext';

interface ListViewProps {
  dateRange: { from: Date, to: Date };
  onDateRangeChange: (newRange: { from: Date, to: Date }) => void;
}

const ListView: React.FC<ListViewProps> = ({ dateRange, onDateRangeChange }) => {

    //console.log('ListView rendered');
    const { yearData, loading, error, currentYear, changeYear } = useExcel();

	console.log('yearData:', yearData);
	const transformedData = React.useMemo(() => {
		if (yearData) {
			const calendarData = createYearCalendarWithData(currentYear, yearData.Dates);
			const requestData: RequestData = {
				Year: currentYear.toString(),
				Range: `1/1/${currentYear}-31/12/${currentYear}`,
				Dates: calendarData
			};
			return transformData(requestData);
		}
		return [];
	}, [yearData, currentYear]);
	console.log('transformedData:', transformedData);
    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: false }])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [expanded, setExpanded] = React.useState({})

    const columns = React.useMemo(() => columnsConfig(), []) as ColumnDef<Booking, any>[];
    
    React.useEffect(() => {
        const fromYear = dateRange.from.getFullYear();
        if (fromYear !== currentYear) {
            console.log('Changing year in ListView');
            changeYear(fromYear);
        }
    }, [dateRange, currentYear, changeYear]);

    const table = useReactTable({
        data: transformedData,
        columns,
        state: {
            sorting,
            columnFilters,
            expanded,
        },
        onSortingChange: setSorting,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onColumnFiltersChange: setColumnFilters,
    });

    React.useEffect(() => {
        table.getColumn("date")?.setFilterValue(dateRange);
    }, [dateRange, table]);

    const handleRowClick = (row: any) => {
        row.toggleExpanded();
    };

    const handleExpandAll = () => {
        table.toggleAllRowsExpanded(true);
    };

    const handleCollapseAll = () => {
        table.toggleAllRowsExpanded(false);
    };

    //if (loading) return <div>Loading...</div>;
	if ( loading ) { 
		return <TableSkeleton />
	}

	//console.log(error);
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-2">
                <DatePickerWithRange 
                    date={dateRange} 
                    setDate={onDateRangeChange}
					className="w-full lg:w-auto"
                />
                <div className="flex space-x-2 w-full lg:w-auto">
                    <Button
                        onClick={handleExpandAll}
                        variant="outline"
                        className="flex flex-1 items-center"
                    >
                        <ChevronDownIcon className="mr-2 h-4 w-4" />
                        Expand All
                    </Button>
                    <Button
                        onClick={handleCollapseAll}
                        variant="outline"
                        className="flex flex-1 items-center"
                    >
                        <ChevronUpIcon className="mr-2 h-4 w-4" />
                        Collapse All
                    </Button>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                            <TableHead key={header.id}>
                                {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                            ))}
                        </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                        <React.Fragment key={row.id}>
                            <TableRow onClick={() => handleRowClick(row)} className="cursor-pointer">
                            {row.getVisibleCells().map(cell => (
                                <TableCell key={cell.id} {...(cell.column.id === 'bookNow' && { className: 'text-right' })}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                            </TableRow>
                            {row.getIsExpanded() && (
                            <TableRow className="bg-muted/40 hover:bg-muted/50">
                                <TableCell colSpan={row.getVisibleCells().length}>
                                	<SubRowComponent subRows={row.original.subRows} />
                                </TableCell>
                            </TableRow>
                            )}
                        </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}

export default ListView;