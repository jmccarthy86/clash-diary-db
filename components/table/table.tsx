"use client"

import * as React from 'react';
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
import SubRowComponent from './sub-row';
import DatePickerWithRange from "./filter-date-range";
import { DataTablePagination } from './table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from "../ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { transformData, createYearCalendarWithData } from '@/lib/utils'
import { columnsConfig } from '@/components/table/columns'
import { useExcel } from '@/context/ExcelContext';

interface ListViewProps {
  dateRange: { from: Date, to: Date };
  onDateRangeChange: (newRange: { from: Date, to: Date }) => void;
}

const ListView: React.FC<ListViewProps> = ({ dateRange, onDateRangeChange }) => {
    const { yearData, loading, error, currentYear, changeYear } = useExcel();

    /**
     * This is the complete sheet for the currently selected year,
     * transformed from the returned excel object, then we're transforming it one more
     * time to work with our tables.
     */
    const transformedData = React.useMemo(() => yearData ? createYearCalendarWithData(currentYear,transformData(yearData.Dates)) : [], [yearData])

    const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: false }])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [expanded, setExpanded] = React.useState({})

    const columns = React.useMemo(() => columnsConfig(), [])
    
    React.useEffect(() => {
        const fromYear = dateRange.from.getFullYear();
        if (fromYear !== currentYear) {
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-4">
                <DatePickerWithRange 
                    date={dateRange} 
                    setDate={onDateRangeChange} 
                />
                <div className="flex space-x-2">
                    <Button
                        onClick={handleExpandAll}
                        variant="outline"
                        className="flex items-center"
                    >
                        <ChevronDownIcon className="mr-2 h-4 w-4" />
                        Expand All
                    </Button>
                    <Button
                        onClick={handleCollapseAll}
                        variant="outline"
                        className="flex items-center"
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