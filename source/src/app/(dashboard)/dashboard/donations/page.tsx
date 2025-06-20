// app/(dashboard)/dashboard/donations/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllDonations } from '@/lib/donations';
import type { Donation, DonationFilters } from '@/types/donations';
import { useForm } from 'react-hook-form';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
    Legend,
} from 'recharts';

export default function DonationsDashboard() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [filters, setFilters] = useState<DonationFilters>({});
    const { register, handleSubmit, watch } = useForm<DonationFilters>();
    const watchFilters = watch();

    useEffect(() => {
        getAllDonations().then(setDonations);
    }, []);

    useEffect(() => {
        setFilters(watchFilters);
    }, [watchFilters]);

    const filtered = useMemo(() => {
        return donations.filter((d) => {
            if (filters.donorName) {
                const text = filters.donorName.toLowerCase();
                if (!(d.donorName.toLowerCase().includes(text) || d.donorEmail.toLowerCase().includes(text))) return false;
            }
            if (filters.donationType && d.donationType !== filters.donationType) return false;
            if (filters.dateFrom && new Date(d.createdAt) < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && new Date(d.createdAt) > new Date(filters.dateTo)) return false;
            return true;
        });
    }, [donations, filters]);

    const chartByType = useMemo(() => {
        const map: Record<string, number> = {};
        filtered.forEach((d) => {
            map[d.donationType] = (map[d.donationType] || 0) + d.amount;
        });
        return Object.entries(map).map(([name, amount]) => ({ name, amount }));
    }, [filtered]);

    const chartByDate = useMemo(() => {
        const map: Record<string, number> = {};
        filtered.forEach((d) => {
            const date = d.createdAt.slice(0, 10);
            map[date] = (map[date] || 0) + d.amount;
        });
        return Object.entries(map)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => (a.date < b.date ? -1 : 1));
    }, [filtered]);

    const pageSize = 10;
    const totalPages = Math.ceil(filtered.length / pageSize);
    const [page, setPage] = useState(1);
    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Donations Dashboard</h1>

            <form onSubmit={handleSubmit(() => { })} className="grid md:grid-cols-4 gap-4 mb-6">
                <input {...register('donorName')} placeholder="Name or Email" className="input" />
                <select {...register('donationType')} className="input">
                    <option value="">All Types</option>
                    {['tithe', 'offering', 'building', 'missions', 'education', 'special'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <input {...register('dateFrom')} type="date" className="input" />
                <input {...register('dateTo')} type="date" className="input" />
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <BarChart data={chartByType}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="amount" fill="#4f46e5" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full h-64">
                    <ResponsiveContainer>
                        <LineChart data={chartByDate}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="amount" stroke="#10b981" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <table className="min-w-full border mb-4">
                <thead>
                    <tr className="bg-gray-200">
                        {['donation_id', 'donorName', 'amount', 'donationType', 'paymentStatus', 'createdAt'].map((col) => (
                            <th key={col} className="px-2 py-1 border">{col}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paged.map((d) => (
                        <tr key={d.donorEmail} className="hover:bg-gray-100">
                            <td className="border px-2 py-1">{d.donorEmail}</td>
                            <td className="border px-2 py-1">{d.donorName}</td>
                            <td className="border px-2 py-1">${d.amount.toFixed(2)}</td>
                            <td className="border px-2 py-1">{d.donationType}</td>
                            <td className="border px-2 py-1">{d.paymentStatus}</td>
                            <td className="border px-2 py-1">{new Date(d.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                        onClick={() => setPage(i + 1)}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
