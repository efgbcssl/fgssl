'use client'

import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Search,
    Filter,
    Download,
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    FileText,
    Mail,
    Phone,
    CreditCard,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

// Mock data generator
const generateMockData = () => {
    const donationTypes = ['tithe', 'offering', 'building', 'missions', 'education', 'special'];
    const paymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'cash', 'check'];
    const paymentStatuses = ['completed', 'pending', 'failed', 'refunded'];
    const currencies = ['USD', 'EUR', 'GBP', 'CAD'];

    const data = [];
    for (let i = 0; i < 250; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 365));

        data.push({
            id: `don_${i + 1}`,
            donorEmail: `donor${i + 1}@example.com`,
            donorName: `Donor ${i + 1}`,
            donorPhone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            donationType: donationTypes[Math.floor(Math.random() * donationTypes.length)],
            amount: Math.floor(Math.random() * 5000) + 10,
            currency: currencies[Math.floor(Math.random() * currencies.length)],
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
            isRecurring: Math.random() > 0.7,
            notes: Math.random() > 0.5 ? `Note for donation ${i + 1}` : '',
            receiptUrl: `https://receipts.example.com/receipt_${i + 1}.pdf`,
            stripeChargeId: `ch_${Math.random().toString(36).substr(2, 24)}`,
            stripePaymentIntentId: `pi_${Math.random().toString(36).substr(2, 24)}`,
            createdAt: date.toISOString()
        });
    }
    return data;
};

export default function DonationsDashboard() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        donationType: '',
        paymentStatus: '',
        paymentMethod: '',
        currency: '',
        isRecurring: '',
        dateFrom: '',
        dateTo: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Initialize with mock data
    useEffect(() => {
        setTimeout(() => {
            setDonations(generateMockData());
            setLoading(false);
        }, 1000);
    }, []);

    // Filter and search logic
    const filteredDonations = useMemo(() => {
        return donations.filter(donation => {
            const matchesSearch =
                donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                donation.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                donation.donorPhone.includes(searchTerm);

            const matchesType = !filters.donationType || donation.donationType === filters.donationType;
            const matchesStatus = !filters.paymentStatus || donation.paymentStatus === filters.paymentStatus;
            const matchesMethod = !filters.paymentMethod || donation.paymentMethod === filters.paymentMethod;
            const matchesCurrency = !filters.currency || donation.currency === filters.currency;
            const matchesRecurring = !filters.isRecurring ||
                (filters.isRecurring === 'true' ? donation.isRecurring : !donation.isRecurring);

            const donationDate = new Date(donation.createdAt);
            const matchesDateFrom = !filters.dateFrom || donationDate >= new Date(filters.dateFrom);
            const matchesDateTo = !filters.dateTo || donationDate <= new Date(filters.dateTo);

            return matchesSearch && matchesType && matchesStatus && matchesMethod &&
                matchesCurrency && matchesRecurring && matchesDateFrom && matchesDateTo;
        });
    }, [donations, searchTerm, filters]);

    // Analytics calculations
    const analytics = useMemo(() => {
        const total = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
        const completedDonations = filteredDonations.filter(d => d.paymentStatus === 'completed');
        const completedTotal = completedDonations.reduce((sum, d) => sum + d.amount, 0);
        const recurringDonations = filteredDonations.filter(d => d.isRecurring);
        const averageDonation = filteredDonations.length > 0 ? total / filteredDonations.length : 0;

        // Monthly trend
        const monthlyData = {};
        filteredDonations.forEach(d => {
            const month = new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            monthlyData[month] = (monthlyData[month] || 0) + d.amount;
        });

        const monthlyTrend = Object.entries(monthlyData)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => new Date(a.month) - new Date(b.month));

        // Donation type breakdown
        const typeBreakdown = {};
        filteredDonations.forEach(d => {
            typeBreakdown[d.donationType] = (typeBreakdown[d.donationType] || 0) + d.amount;
        });

        const typeData = Object.entries(typeBreakdown)
            .map(([type, amount]) => ({ type, amount }));

        // Payment method breakdown
        const methodBreakdown = {};
        filteredDonations.forEach(d => {
            methodBreakdown[d.paymentMethod] = (methodBreakdown[d.paymentMethod] || 0) + 1;
        });

        const methodData = Object.entries(methodBreakdown)
            .map(([method, count]) => ({ method, count }));

        return {
            total,
            completedTotal,
            totalDonations: filteredDonations.length,
            completedDonations: completedDonations.length,
            recurringCount: recurringDonations.length,
            averageDonation,
            monthlyTrend,
            typeData,
            methodData
        };
    }, [filteredDonations]);

    // Pagination
    const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDonations = filteredDonations.slice(startIndex, startIndex + itemsPerPage);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'refunded': return <RefreshCw className="w-4 h-4 text-blue-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            refunded: 'bg-blue-100 text-blue-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-lg text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        💝 Donations Dashboard
                    </h1>
                    <p className="text-gray-600">Comprehensive overview of donation activities and analytics</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.total)}</p>
                                <p className="text-sm text-green-600 flex items-center mt-1">
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                    +12.5% from last month
                                </p>
                            </div>
                            <DollarSign className="w-12 h-12 text-green-500 bg-green-100 rounded-lg p-2" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Donors</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.totalDonations}</p>
                                <p className="text-sm text-green-600 flex items-center mt-1">
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                    +8.2% from last month
                                </p>
                            </div>
                            <Users className="w-12 h-12 text-blue-500 bg-blue-100 rounded-lg p-2" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Donation</p>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.averageDonation)}</p>
                                <p className="text-sm text-red-600 flex items-center mt-1">
                                    <ArrowDownRight className="w-4 h-4 mr-1" />
                                    -2.1% from last month
                                </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-purple-500 bg-purple-100 rounded-lg p-2" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Recurring Donations</p>
                                <p className="text-3xl font-bold text-gray-900">{analytics.recurringCount}</p>
                                <p className="text-sm text-green-600 flex items-center mt-1">
                                    <ArrowUpRight className="w-4 h-4 mr-1" />
                                    +15.3% from last month
                                </p>
                            </div>
                            <RefreshCw className="w-12 h-12 text-orange-500 bg-orange-100 rounded-lg p-2" />
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        <select
                            value={filters.donationType}
                            onChange={(e) => setFilters({ ...filters, donationType: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="tithe">Tithe</option>
                            <option value="offering">Offering</option>
                            <option value="building">Building</option>
                            <option value="missions">Missions</option>
                            <option value="education">Education</option>
                            <option value="special">Special</option>
                        </select>

                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>

                        <select
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Methods</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="debit_card">Debit Card</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                        </select>

                        <select
                            value={filters.currency}
                            onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Currencies</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CAD">CAD</option>
                        </select>

                        <select
                            value={filters.isRecurring}
                            onChange={(e) => setFilters({ ...filters, isRecurring: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">All Donations</option>
                            <option value="true">Recurring Only</option>
                            <option value="false">One-time Only</option>
                        </select>

                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />

                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Donation Trends</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(value), 'Amount']}
                                    labelStyle={{ color: '#374151' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Donations by Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.typeData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="amount"
                                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {analytics.typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [formatCurrency(value), 'Amount']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donations Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Donations</h3>
                        <p className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredDonations.length)} of {filteredDonations.length} donations</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedDonations.map((donation) => (
                                    <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-10 h-10">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-indigo-600 font-medium text-sm">
                                                            {donation.donorName.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{donation.donorName}</div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {donation.donorEmail}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Phone className="w-3 h-3 mr-1" />
                                                        {donation.donorPhone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 capitalize">{donation.donationType}</span>
                                                {donation.isRecurring && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        Recurring
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(donation.amount, donation.currency)}
                                            </div>
                                            <div className="text-sm text-gray-500">{donation.currency}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="capitalize">{donation.paymentMethod.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(donation.paymentStatus)}
                                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(donation.paymentStatus)}`}>
                                                    {donation.paymentStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(donation.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50">
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredDonations.length)}</span> of{' '}
                                <span className="font-medium">{filteredDonations.length}</span> results
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + Math.max(1, currentPage - 2);
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 text-sm rounded-md ${currentPage === page
                                            ? 'bg-indigo-600 text-white'
                                            : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}