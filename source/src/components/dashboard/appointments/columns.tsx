"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Appointment } from '@/types/appointments'
import { Badge } from '@/components/ui/badge'
import { EditStatusDialog } from './edit-status-dialog'

export const columns: ColumnDef<Appointment, unknown>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'createdAt',
        header: 'Date Submitted',
        cell: ({ row }) => {
            return new Date(row.getValue('createdAt')).toLocaleString()
        }
    },
    {
        accessorKey: 'fullName',
        header: 'Name',
    },
    {
        accessorKey: 'phoneNumber',
        header: 'Phone',
    },
    {
        accessorKey: 'preferredDate',
        header: 'Preferred Date',
        cell: ({ row }) => {
            return new Date(row.getValue('preferredDate')).toLocaleString()
        }
    },
    {
        accessorKey: 'medium',
        header: 'Meeting Type',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status')
            return (
                <Badge
                    variant={
                        status === 'completed' ? 'default' :
                            status === 'cancelled' ? 'destructive' : 'secondary'
                    }
                >
                    {String(status)}
                </Badge>
            )
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const appointment = row.original
            return <EditStatusDialog appointment={appointment} />
        }
    }
]