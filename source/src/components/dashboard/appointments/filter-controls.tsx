"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DateRangePicker } from '@/components/ui/date-range-picker'

interface FilterControlsProps {
    status: string | null
    onStatusChange: (value: string | null) => void
    medium: string | null
    onMediumChange: (value: string | null) => void
    createdRange: [Date, Date] | null
    onCreatedRangeChange: (range: [Date, Date] | null) => void
    preferredRange: [Date, Date] | null
    onPreferredRangeChange: (range: [Date, Date] | null) => void
}

export function FilterControls({
    status,
    onStatusChange,
    medium,
    onMediumChange,
    createdRange,
    onCreatedRangeChange,
    preferredRange,
    onPreferredRangeChange
}: FilterControlsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Label>Status</Label>
                <Select value={status ?? ''} onValueChange={(val) => onStatusChange(val || null)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Meeting Type</Label>
                <Select value={medium ?? ''} onValueChange={(val) => onMediumChange(val || null)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Created Date Range</Label>
                <DateRangePicker value={createdRange} onChange={onCreatedRangeChange} />
            </div>

            <div>
                <Label>Preferred Date Range</Label>
                <DateRangePicker value={preferredRange} onChange={onPreferredRangeChange} />
            </div>
        </div>
    )
}
