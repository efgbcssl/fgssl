"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Appointment } from '@/types/appointments'
import { Badge } from '@/components/ui/badge'
import { EditStatusDialog } from './edit-status-dialog'
import { ArrowDown, ArrowUp } from 'lucide-react'

export const columns: ColumnDef<Appointment>[] = [
    {
        id: 'rowNumber',
        header: 'ID',
        cell: ({ row }) => row.index + 1,
        enableSorting: false,
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <div
                className="cursor-pointer flex items-center gap-1"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Date Submitted
                {column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : null}
            </div>
        ),
        enableSorting: true,
        cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleString(),
    },
    {
        accessorKey: 'fullName',
        header: ({ column }) => (
            <div
                className="cursor-pointer flex items-center gap-1"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Name
                {column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : null}
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: 'phoneNumber',
        header: 'Phone',
        enableSorting: false,
    },
    {
        accessorKey: 'preferredDate',
        header: ({ column }) => (
            <div
                className="cursor-pointer flex items-center gap-1"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Preferred Date
                {column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : null}
            </div>
        ),
        enableSorting: true,
        cell: ({ row }) => new Date(row.getValue('preferredDate')).toLocaleString(),
    },
    {
        accessorKey: 'medium',
        header: ({ column }) => (
            <div
                className="cursor-pointer flex items-center gap-1"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Meeting Type
                {column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : null}
            </div>
        ),
        enableSorting: true,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <div
                className="cursor-pointer flex items-center gap-1"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Status
                {column.getIsSorted() === 'asc' ? <ArrowUp className="h-4 w-4" /> : column.getIsSorted() === 'desc' ? <ArrowDown className="h-4 w-4" /> : null}
            </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
            const status = row.getValue('status')
            return (
                <Badge
                    variant={
                        status === 'completed'
                            ? 'default'
                            : status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                    }
                >
                    {String(status)}
                </Badge>
            )
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <EditStatusDialog
                appointment={row.original}
                onStatusChange={(newStatus: string) => {
                    row.original.status = newStatus as Appointment['status']
                    // TODO: Trigger a state update in the parent component to refresh the table if needed
                }}
            />
        )
    },
]
