"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import { Cross2Icon, ReloadIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface FilterControlsProps {
    status: string | null
    onStatusChange: (value: string | null) => void
    medium: string | null
    onMediumChange: (value: string | null) => void
    createdRange: [Date, Date] | null
    onCreatedRangeChange: (range: [Date, Date] | null) => void
    preferredRange: [Date, Date] | null
    onPreferredRangeChange: (range: [Date, Date] | null) => void
    disabled?: boolean
    onClearAll?: () => void
    isLoading?: boolean
}

export function FilterControls({
    status,
    onStatusChange,
    medium,
    onMediumChange,
    createdRange,
    onCreatedRangeChange,
    preferredRange,
    onPreferredRangeChange,
    disabled = false,
    onClearAll,
    isLoading = false
}: FilterControlsProps) {
    const hasActiveFilters = status || medium || createdRange || preferredRange

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-sm font-semibold">Filters</h3>
                <div className="flex items-center gap-2">
                    {isLoading && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ReloadIcon className="h-3 w-3 animate-spin" />
                            <span>Applying filters...</span>
                        </div>
                    )}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            disabled={disabled}
                            className="h-8 px-2 lg:px-3"
                        >
                            <Cross2Icon className="mr-2 h-4 w-4" />
                            Clear all
                        </Button>
                    )}
                </div>
            </div>

            <div className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                disabled && "opacity-50 pointer-events-none"
            )}>
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={status ?? 'all'}
                        onValueChange={(val) => onStatusChange(val === 'all' ? null : val)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Meeting Type</Label>
                    <Select
                        value={medium ?? 'all'}
                        onValueChange={(val) => onMediumChange(val === 'all' ? null : val)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="in-person">In-Person</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Created Date Range</Label>
                    <DateRangePicker
                        value={createdRange}
                        onChange={onCreatedRangeChange}

                    />
                </div>

                <div className="space-y-2">
                    <Label>Preferred Date Range</Label>
                    <DateRangePicker
                        value={preferredRange}
                        onChange={onPreferredRangeChange}

                    />
                </div>
            </div>
        </div>
    )
}