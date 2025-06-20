// lib/donations.ts
import { xata } from '@/lib/xata';
import type { DonationsRecord } from '@/xata'; // from Xata codegen
import type { Donation } from '@/types/donations';
import { v4 as uuidv4 } from 'uuid';

function mapRecord(record: DonationsRecord): Donation {
    return {
        donation_id: uuidv4(),
        amount: record.amount!,
        currency: record.currency ?? 'USD',
        donationType: record.donationType!,
        donor_id: uuidv4(),
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
