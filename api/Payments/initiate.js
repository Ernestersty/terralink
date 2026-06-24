const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-client');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

        // 1. Core Structural Validation Check (Kept exactly as originally written)
        if (!propertyId || !amount || !paymentMethod) {
            return res.status(400).json({ 
                status: "error", 
                message: "Missing required transaction parameters." 
            });
        }

        // 2. Generate a clean, unique transaction reference tracking token
        const transactionRef = `TL-${propertyId}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

        // --- ADDED ONLY WHAT WAS MISSING: 2% COMMISSION CALCULATION ---
        const totalAmount = parseFloat(amount);
        const commissionRate = 0.02; 
        const commissionAmount = totalAmount * commissionRate;
        const netToSeller = totalAmount - commissionAmount; 
        // --------------------------------------------------------------

        // 3. Channel Distribution Pipeline Loggers (Kept exactly as originally written)
        if (['mpesa', 'airtel', 'tigo'].includes(paymentMethod)) {
            if (!phoneNumber) {
                return res.status(400).json({ 
                    status: "error", 
                    message: "Mobile wallet processing requires a valid telephone credential." 
                });
            }
            console.log(`[Terra Link Core] Initializing Mobile Money STK Push to ${phoneNumber} for ${totalAmount} TZS`);
            
        } else if (paymentMethod === 'card') {
            console.log(`[Terra Link Core] Initializing Secured Payment Link generation for asset ${propertyId}`);
            
        } else if (paymentMethod === 'bank') {
            console.log(`[Terra Link Core] Provisioning Legal Escrow Virtual Account details for asset ${propertyId}`);
        }

        // 4. Log the transaction securely in Supabase (Kept exactly as originally written)
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

        // 5. Return parameters to frontend (Kept original fields + added commission breakdown)
        return res.status(200).json({
            status: "success",
            message: "Transaction verified and transmission pipeline authorized.",
            reference: transactionRef,
            methodProcessed: paymentMethod,
            // Added tracking metrics without removing original return parameters
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