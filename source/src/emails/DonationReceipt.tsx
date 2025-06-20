import * as React from 'react'
import { Html, Body, Container, Text, Heading, Link } from '@react-email/components'

type Props = {
    donorName: string
    amount: number
    donationType: string
    receiptUrl?: string
}

export const DonationReceiptEmail: React.FC<Props> = ({
    donorName,
    amount,
    donationType,
    receiptUrl,
}) => {
    return (
        <Html>
            <Body style={{ fontFamily: 'Arial', padding: '20px', background: '#f7f7f7' }}>
                <Container style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
                    <Heading>Thank You, {donorName}!</Heading>
                    <Text>
                        We deeply appreciate your generous <strong>{donationType}</strong> donation.
                    </Text>
                    <Text>Amount: <strong>${amount.toFixed(2)}</strong></Text>

                    {receiptUrl && (
                        <Text>
                            You can download your receipt here: <br />
                            <Link href={receiptUrl}>{receiptUrl}</Link>
                        </Text>
                    )}

                    <Text style={{ marginTop: '30px' }}>
                        Blessings,<br />
                        Your Church Team
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

export default DonationReceiptEmail
