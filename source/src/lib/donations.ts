// lib/donations.ts
import { xata } from '@/lib/xata';
import type { DonationsRecord } from '@/xata'; // from Xata codegen
import type { Donation } from '@/types/donations';

function mapRecord(record: DonationsRecord): Donation {
    return {
        amount: record.amount!,
        currency: record.currency ?? 'USD',
        donationType: record.donationType!,
        donorName: record.donorName!,
        donorEmail: record.donorEmail!,
        donorPhone: record.donorPhone ?? '',
        paymentMethod: record.paymentMethod!,
        paymentStatus: record.paymentStatus!,
        stripePaymentIntentId: record.stripePaymentIntentId!,
        stripeChargeId: record.stripeChargeId ?? '',
        receiptUrl: record.receiptUrl ?? '',
        isRecurring: record.isRecurring ?? false,
        notes: record.notes ?? '',
        createdAt: record.xata_createdat!.toISOString(),
    };
}

export async function getAllDonations(): Promise<Donation[]> {
    const records = await xata.db.donations
        .select(['*'])
        .sort('xata_createdat', 'desc')
        .getMany();
    return records.map(mapRecord);
}
