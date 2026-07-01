import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_REASONABLE_AMOUNT = 5_000_000_000;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            status: "error",
            message: `Method ${req.method} Not Allowed`
        });
    }

    try {
        const { propertyId, amount, paymentMethod, phoneNumber } = req.body;

        if (!propertyId || !amount || !paymentMethod) {
            return res.status(400).json({
                status: "error",
                message: "Missing required transaction parameters."
            });
        }

        const validMethods = ['mpesa', 'airtel', 'tigo', 'card', 'bank'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                status: "error",
                message: "Unrecognized payment method."
            });
        }

        const clientAmount = parseFloat(amount);
        if (!Number.isFinite(clientAmount) || clientAmount <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid transaction amount."
            });
        }

        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('id, price, title')
            .eq('id', propertyId)
            .single();

        if (propertyError || !property) {
            return res.status(404).json({
                status: "error",
                message: "Property not found."
            });
        }

        const listedPrice = parseFloat(property.price);

        if (Math.abs(clientAmount - listedPrice) > 1) {
            return res.status(400).json({
                status: "error",
                message: "Submitted amount does not match the listed price for this property."
            });
        }

        if (listedPrice > MAX_REASONABLE_AMOUNT) {
            console.warn(`[Terra Link Core] Property ${propertyId} price exceeds sanity ceiling: ${listedPrice}`);
            return res.status(400).json({
                status: "error",
                message: "This listing's price requires manual review before payment can proceed."
            });
        }

        const transactionRef = `TL-${propertyId}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

        const totalAmount = listedPrice;
        const commissionRate = 0.02;
        const commissionAmount = totalAmount * commissionRate;
        const netToSeller = totalAmount - commissionAmount;

        if (['mpesa', 'airtel', 'tigo'].includes(paymentMethod) && !phoneNumber) {
            return res.status(400).json({
                status: "error",
                message: "Mobile wallet processing requires a valid telephone credential."
            });
        }

        console.log(`[Terra Link Core] Payment attempt logged — method: ${paymentMethod}, property: ${propertyId}, amount: ${totalAmount} TZS (pending, no provider connected yet)`);

        const { error: dbError } = await supabase
            .from('payments')
            .insert([
                {
                    property_id: propertyId,
                    amount: totalAmount,
                    payment_method: paymentMethod,
                    phone_number: phoneNumber || null,
                    status: 'pending',
                    transaction_reference: transactionRef
                }
            ]);

        if (dbError) {
            console.error("Supabase payment registration error:", dbError);
            return res.status(500).json({
                status: "error",
                message: "Failed to anchor security ledger record."
            });
        }

        return res.status(200).json({
            status: "pending",
            message: "Transaction recorded. Payment provider integration is not yet connected — no funds have moved.",
            reference: transactionRef,
            methodProcessed: paymentMethod,
            commissionAmount: commissionAmount,
            netToSeller: netToSeller
        });

    } catch (error) {
        console.error("Error handling money system execution:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal structural payment fault occurred."
        });
    }
}