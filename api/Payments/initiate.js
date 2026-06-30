const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js'); // FIXED: was '@supabase/supabase-client', which doesn't exist

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_REASONABLE_AMOUNT = 5_000_000_000; // 5 billion TZS sanity ceiling — adjust to your market

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

        // 1. Core Structural Validation Check
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

        // 2. SERVER-SIDE PRICE VALIDATION — this is the fix for the core vulnerability.
        // Never trust the amount from the client. Look up the real price and compare.
        // NOTE: confirm 'price' is the actual column name in your properties table —
        // swap below if it's actually 'listing_price' or something else.
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

        // Allow a tiny tolerance for float rounding, but otherwise the offer must match the listing.
        const tolerance = 1; // 1 TZS tolerance for rounding
        if (Math.abs(clientAmount - listedPrice) > tolerance) {
            return res.status(400).json({
                status: "error",
                message: `Submitted amount does not match the listed price for this property.`
            });
        }

        if (listedPrice > MAX_REASONABLE_AMOUNT) {
            // Sanity ceiling — catches data errors or absurd listings before they hit a payment flow.
            console.warn(`[Terra Link Core] Property ${propertyId} has a price exceeding sanity ceiling: ${listedPrice}`);
            return res.status(400).json({
                status: "error",
                message: "This listing's price requires manual review before payment can proceed."
            });
        }

        // 3. Generate a clean, unique transaction reference tracking token
        const transactionRef = `TL-${propertyId}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

        // Use the verified listedPrice from here on, NOT clientAmount.
        const totalAmount = listedPrice;
        const commissionRate = 0.02;
        const commissionAmount = totalAmount * commissionRate;
        const netToSeller = totalAmount - commissionAmount;

        // 4. Mobile money requires a phone number
        if (['mpesa', 'airtel', 'tigo'].includes(paymentMethod) && !phoneNumber) {
            return res.status(400).json({
                status: "error",
                message: "Mobile wallet processing requires a valid telephone credential."
            });
        }

        // NOTE: No real payment provider is connected yet (no Selcom/M-Pesa/Airtel/card
        // integration exists). This logs the attempt and records a PENDING transaction only.
        // Status will stay 'pending' until a real provider integration confirms it —
        // do NOT treat 'pending' as paid anywhere in the frontend.
        console.log(`[Terra Link Core] Payment attempt logged — method: ${paymentMethod}, property: ${propertyId}, amount: ${totalAmount} TZS (pending, no provider connected yet)`);

        // 5. Log the transaction in Supabase as PENDING
        const { error: dbError } = await supabase
            .from('payments')
            .insert([
                {
                    property_id: propertyId,
                    amount: totalAmount,
                    payment_method: paymentMethod,
                    phone_number: phoneNumber || null,
                    status: 'pending', // stays pending until a real provider confirms payment
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

        // 6. Return PENDING status — not success. There is no real payment yet.
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