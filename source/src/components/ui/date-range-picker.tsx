"use client"

import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

interface DateRangePickerProps {
    value: [Date, Date] | null
    onChange: (range: [Date, Date] | null) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const from = value?.[0]
    const to = value?.[1]

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from && to ? (
                        `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="range"
                    selected={{ from, to }}
                    onSelect={(range: DateRange | undefined) => {
                        if (range?.from && range?.to) {
                            onChange([range.from, range.to])
                            setOpen(false)
                        }
                    }}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    )
}
