export interface Donation {
    amount: number;
    currency: string;
    donationType: string;
    donorName: string;
    donorEmail: string;
    donorPhone?: string;
    paymentMethod: string;
    paymentStatus: string;
    stripePaymentIntentId: string;
    stripeChargeId?: string;
    receiptUrl?: string;
    isRecurring: boolean;
    notes?: string;
    createdAt: string;
}

export interface DonationFilters {
    donorName?: string;
    donationType?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'dateAsc' | 'dateDesc' | 'amountAsc' | 'amountDesc';
}
