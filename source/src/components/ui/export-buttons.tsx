// components/ui/export-buttons.tsx
"use client"

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportButtonsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>[]
    filename: string
    disabled: boolean
}

export function ExportButtons({ data, filename, disabled }: ExportButtonsProps) {
    const headers = Object.keys(data[0] || {})

    const exportCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
        XLSX.writeFile(workbook, `${filename}.csv`)
    }

    const exportExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
        XLSX.writeFile(workbook, `${filename}.xlsx`)
    }

    const exportPDF = () => {
        const doc = new jsPDF()
        autoTable(doc, {
            head: [headers],
            body: data.map(row => headers.map(h => row[h]))
        })
        doc.save(`${filename}.pdf`)
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
                <Download className="mr-2 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
                <Download className="mr-2 h-4 w-4" /> PDF
            </Button>
        </div>
    )
}
