import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const PriceInput = ({
    price,
    currency,
    onChange
}: {
    price: number
    currency: string
    onChange: (price: number, currency: string) => void
}) => {
    const currencies = [
        { code: 'USD', symbol: '$' },
        { code: 'EUR', symbol: '€' },
        { code: 'GBP', symbol: '£' },
        { code: 'CAD', symbol: 'CA$' },
        { code: 'AUD', symbol: 'A$' }
    ]

    return (
        <div className="flex items-center space-x-2">
            <Select
                value={currency}
                onValueChange={(value) => onChange(price, value)}
            >
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                    {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                type="number"
                min="0"
                step="0.01"
                value={price || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0, currency)}
                className="w-[150px]"
            />
        </div>
    )
}