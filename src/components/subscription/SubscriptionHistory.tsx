'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Invoice {
  id: string;
  amount_paid: number;
  status: string;
  created: string;
  invoice_pdf: string;
  currency: string;
}

export function SubscriptionHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/stripe/invoices', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setInvoices(data.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  if (loading) {
    return <div>Loading billing history...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (invoices.length === 0) {
    return <p className="text-sm text-muted-foreground">No billing history available</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invoice</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(invoice => (
          <TableRow key={invoice.id}>
            <TableCell>{new Date(invoice.created).toLocaleDateString()}</TableCell>
            <TableCell>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: invoice.currency?.toUpperCase() || 'EUR' }).format(invoice.amount_paid / 100)}</TableCell>
            <TableCell>
              <span
                className={`capitalize ${
                  invoice.status === 'paid' ? 'text-green-500' : 'text-yellow-500'
                }`}
              >
                {invoice.status}
              </span>
            </TableCell>
            <TableCell>
              <a
                href={invoice.invoice_pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Download
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
