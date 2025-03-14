import { PaymentInfo } from '@/types';
import { db } from '@/app/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface PaymentGatewayConfig {
    type: 'phonepe' | 'googlepay' | 'upi' | 'custom';
    apiKey?: string;
    merchantId?: string;
    callbackUrl?: string;
}

interface PaymentRequest {
    amount: number;
    userId: string;
    quizId: string;
    paymentMethods: string[];
}

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

// Fetch payment gateway configuration from admin settings
const getPaymentConfig = async (): Promise<PaymentGatewayConfig> => {
    const settingsDoc = await getDoc(doc(db, 'admin', 'settings'));
    if (!settingsDoc.exists()) {
        return { type: 'upi' }; // Default fallback
    }
    return settingsDoc.data().paymentGateway as PaymentGatewayConfig;
};

export const processPayment = async (request: PaymentRequest): Promise<PaymentResult> => {
    try {
        const config = await getPaymentConfig();
        
        // This is a mock implementation that can be replaced with actual payment gateway
        const paymentInfo: PaymentInfo = {
            id: Math.random().toString(36).substring(2),
            userId: request.userId,
            quizId: request.quizId,
            amount: request.amount,
            status: 'completed',
            transactionId: Math.random().toString(36).substring(2),
            paymentMethod: request.paymentMethods[0],
            timestamp: new Date()
        };

        // Save payment info to Firestore
        await setDoc(doc(db, 'payments', paymentInfo.id), paymentInfo);

        return {
            success: true,
            transactionId: paymentInfo.transactionId
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            success: false,
            error: 'Payment processing failed'
        };
    }
};

// Function to validate and process UPI payments
export const processUPIPayment = async (upiId: string, amount: number): Promise<PaymentResult> => {
    // Implementation can be added when UPI gateway is integrated
    return processPayment({
        amount,
        userId: 'temp',
        quizId: 'temp',
        paymentMethods: ['upi']
    });
};

// Function to validate and process PhonePe payments
export const processPhonePePayment = async (phoneNumber: string, amount: number): Promise<PaymentResult> => {
    // Implementation can be added when PhonePe gateway is integrated
    return processPayment({
        amount,
        userId: 'temp',
        quizId: 'temp',
        paymentMethods: ['phonepe']
    });
};
