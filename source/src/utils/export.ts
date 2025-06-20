// utils/export.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Donation } from '@/types/donations';

function normalize(data: Donation[]) {
    return data.map((d) => ({
        Amount: d.amount,
        Currency: d.currency,
        Type: d.donationType,
        Donor: d.donorName,
        Email: d.donorEmail,
        Phone: d.donorPhone,
        Status: d.paymentStatus,
        Date: new Date(d.createdAt).toLocaleDateString(),
    }));
}

export function exportToExcel(data: Donation[]) {
    const ws = XLSX.utils.json_to_sheet(normalize(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Donations");
    XLSX.writeFile(wb, "donations.xlsx");
}

export function exportToPDF(data: Donation[]) {
    const doc = new jsPDF();
    const rows = normalize(data);
    const cols = Object.keys(rows[0] || {});
    autoTable(doc, {
        head: [cols],
        body: rows.map(Object.values),
    });
    doc.save("donations.pdf");
}
