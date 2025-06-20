import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type DataTableProps<T extends object> = {
    data: T[];
};

export function DataTable<T extends object>({ data }: DataTableProps<T>) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {Object.keys(data[0] || {}).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item, idx) => (
                    <TableRow key={idx}>
                        {Object.values(item).map((value, i) => (
                            <TableCell key={i}>{String(value)}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}