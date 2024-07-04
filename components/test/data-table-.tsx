"use client"

import React, { useState } from 'react';
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

type Booking = {
  date: string;
  subRows: {
    showTitle: string;
    venue: string;
    pressContact: string;
  }[];
};

const subRowColumns: ColumnDef<Booking['subRows'][number]>[] = [
  {
    header: 'Show Title',
    accessorKey: 'showTitle',
  },
  {
    header: 'Venue',
    accessorKey: 'venue',
  },
  {
    header: 'Press Contact',
    accessorKey: 'pressContact',
  },
  {
    header: 'Actions',
    cell: ({ row }) => <TableRowActions booking={row.original} />,
  },
];

function TableRowActions({ booking }: { booking: Booking['subRows'][number] }) {
  return <button>Edit</button>; // Implement your actions here
}

export function BookingsTable() {
  const [globalFilter, setGlobalFilter] = useState('');
  const data: Booking[] = [
    {
      date: '2024-01-24',
      subRows: [
        {
          showTitle: "Long Day's Journey Into Night",
          venue: "Wyndham's Theatre",
          pressContact: 'kate@breadandbutterpr.uk',
        },
        {
          showTitle: "Long Day's Journey Into Night",
          venue: "Wyndham's Theatre",
          pressContact: 'kate@breadandbutterpr.uk',
        },
      ],
    },
    {
      date: '2024-01-25',
      subRows: [
        {
          showTitle: "Long Day's Journey Into Night",
          venue: "Wyndham's Theatre",
          pressContact: 'kate@breadandbutterpr.uk',
        },
        {
          showTitle: "Long Day's Journey Into Night",
          venue: "Wyndham's Theatre",
          pressContact: 'kate@breadandbutterpr.uk',
        },
      ],
    },
    // Add more data as needed
  ];

  const columns: ColumnDef<Booking>[] = [
    {
      header: 'Date',
      accessorKey: 'date',
      sortingFn: 'datetime',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      return (
        row.original.date.includes(filterValue) ||
        row.original.subRows.some(subRow =>
          Object.values(subRow).some(
            value =>
              typeof value === 'string' &&
              value.toLowerCase().includes(filterValue.toLowerCase())
          )
        )
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="p-2">
      <input
        type="text"
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search all columns..."
        className="p-2 mb-4 border rounded"
      />
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <React.Fragment key={row.id}>
              <tr>
                <td className="font-bold">{row.original.date}</td>
              </tr>
              {row.original.subRows.map((subRow, subRowIndex) => (
                <tr key={`${row.id}-${subRowIndex}`}>
                  {subRowColumns.map(column => (
                    <td key={`${row.id}-${subRowIndex}-${column.accessorKey}`}>
                      {flexRender(column.cell ?? column.accessorKey, {
                        row: { original: subRow },
                        getValue: () => subRow[column.accessorKey],
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-2 border rounded"
        >
          Previous
        </button>
        <span className="mx-2">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-2 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}
