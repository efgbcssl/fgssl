// emails/DonationReceipt.tsx
import * as React from 'react';

interface ReceiptEmailProps {
    donorName: string;
    amount: number;
    donationType: string;
    receiptUrl?: string;
}

export function DonationReceiptEmail({ donorName, amount, donationType, receiptUrl }: ReceiptEmailProps) {
    return (
        <div style={{ fontFamily: 'sans-serif', lineHeight: 1.5 }}>
            <h2>Thank You, {donorName}!</h2>
            <p>We appreciate your generous <strong>{donationType}</strong> donation of <strong>${amount.toFixed(2)}</strong>.</p>
            <p>Your support makes a big difference in our mission.</p>
            {receiptUrl && (
                <p>
                    You can download your donation receipt <a href={receiptUrl} target="_blank" rel="noopener noreferrer">here</a>.
                </p>
            )}
            <p>God bless you abundantly! 🙏</p>
            <p>— Your Church Family</p>
        </div>
    );
}
