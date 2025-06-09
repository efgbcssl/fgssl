"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

export function TimePicker({
    value,
    onChange,
    disabledTimes = [],
    isLoading = false
}: {
    value: string
    onChange: (value: string) => void
    disabledTimes?: string[]
    isLoading?: boolean
}) {
    const times = []
    for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            times.push(timeStr)
        }
    }

    return (
        <Select value={value} onValueChange={onChange} disabled={isLoading}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
                {times.map((time) => (
                    <SelectItem
                        key={time}
                        value={time}
                        disabled={disabledTimes.includes(time)}
                        className={disabledTimes.includes(time) ? 'text-gray-400' : ''}
                    >
                        {time}
                        {disabledTimes.includes(time) && ' (Booked)'}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}