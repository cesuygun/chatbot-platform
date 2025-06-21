import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe, invoiceSchema, formatStripeDate } from '@/lib/stripe';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    // Initialize Stripe client lazily
    const stripe = getStripe();

    // Get user's Stripe customer ID from Supabase
    const { data: userData, error: userError } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      // Return empty invoices array instead of 404 error
      return NextResponse.json({ invoices: [] });
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
