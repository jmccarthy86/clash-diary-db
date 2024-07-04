"use client"

import * as React from "react"
import { TableRowActions } from "./table-row-actions"
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

interface SubRowComponentProps {
    subRows?: SubRowData[];
}

export function SubRowComponent({ subRows }: SubRowComponentProps) {
  const { loading, error } = useExcel();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!subRows) return null;

  return (
    <Table>
        <TableHeader>
            <TableRow>
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
                <TableRow key={index}>
                    <TableCell>{subRow.TitleOfShow}</TableCell>
                    <TableCell>{subRow.Venue}</TableCell>
                    <TableCell>{subRow.PressContact}</TableCell>
                    <TableCell>
                        <TableRowActions subRow={subRow} />
                    </TableCell>
                </TableRow>
            )
        ))}
        </TableBody>
    </Table>
  )
};

export default SubRowComponent;