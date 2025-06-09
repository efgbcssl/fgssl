"use client"

import { Button } from './button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeSelectProps {
    value: string
    onChange: (value: string) => void
    options: string[]
    disabledOptions?: string[]
    isLoading?: boolean
    className?: string
}

export function TimeSelect({
    value,
    onChange,
    options,
    disabledOptions = [],
    isLoading = false,
    className
}: TimeSelectProps) {
    return (
        <div className={cn('grid grid-cols-3 gap-2', className)}>
            {options.map((option) => (
                <Button
                    key={option}
                    type="button"
                    variant={value === option ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onChange(option)}
                    disabled={disabledOptions.includes(option) || isLoading}
                    className={cn(
                        'text-sm',
                        disabledOptions.includes(option) && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    {option}
                    {isLoading && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
                </Button>
            ))}
        </div>
    )
}