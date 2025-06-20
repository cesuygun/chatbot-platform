import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe, invoiceSchema, formatStripeDate } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Initialize Stripe client lazily
    const stripe = getStripe();

    // Get user's Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'User not found or no Stripe customer ID' },
        { status: 404 }
      );
    }

    // Get invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: userData.stripe_customer_id,
      limit: 10,
    });

    // Validate and transform invoice data
    const validatedInvoices = invoices.data.map(invoice => {
      const invoiceData = {
        id: invoice.id,
        amount_paid: invoice.amount_paid,
        status: invoice.status,
        created: invoice.created,
        invoice_pdf: invoice.invoice_pdf,
      };

      const validationResult = invoiceSchema.safeParse(invoiceData);
      if (!validationResult.success) {
        throw new Error('Invalid invoice data');
      }

      return {
        ...invoiceData,
        created: formatStripeDate(invoiceData.created),
      };
    });

    return NextResponse.json({ invoices: validatedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
