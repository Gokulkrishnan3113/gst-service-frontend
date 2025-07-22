import React, { useState, useEffect } from 'react';
import { Filing, Invoice } from '../services/api';
import { apiService } from '../services/api';

interface GSTFilingsProps {
  gstin: string;
}

const GSTFilings: React.FC<GSTFilingsProps> = ({ gstin }) => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiling, setExpandedFiling] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilings = async () => {
      try {
        setLoading(true);
        const response = await apiService.getFilingsWithInvoices(gstin);
        setFilings(response);
      } catch (err) {
        setError('Failed to fetch filings');
        console.error('Error fetching filings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (gstin) {
      fetchFilings();
    }
  }, [gstin]);

  const formatCurrency = (amount: string | number | null | undefined): string => {
    if (!amount || amount === '' || amount === 'null' || amount === 'undefined') {
      return '₹0.00';
    }
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return '₹0.00';
    }
    
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (['completed', 'processed'].includes(statusLower)) {
      bgColor = 'bg-green-100 text-green-800';
    } else if (statusLower === 'pending') {
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (['cancelled', 'rejected'].includes(statusLower)) {
      bgColor = 'bg-red-100 text-red-800';
    } else if (statusLower === 'draft') {
      bgColor = 'bg-gray-100 text-gray-800';
    } else {
      bgColor = 'bg-blue-100 text-blue-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusLower = paymentStatus?.toLowerCase() || '';
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (['paid', 'completed'].includes(statusLower)) {
      bgColor = 'bg-green-100 text-green-800';
    } else if (['pending', 'processing'].includes(statusLower)) {
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (['failed', 'cancelled'].includes(statusLower)) {
      bgColor = 'bg-red-100 text-red-800';
    } else if (statusLower === 'partial') {
      bgColor = 'bg-orange-100 text-orange-800';
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {paymentStatus}
      </span>
    );
  };

  const calculateTotals = (invoices: Invoice[]) => {
    return invoices.reduce((totals, invoice) => ({
      totalAmount: totals.totalAmount + parseFloat(invoice.total_amount || '0'),
      totalTax: totals.totalTax + parseFloat(invoice.total_tax || '0'),
      totalAmountPaid: totals.totalAmountPaid + parseFloat(invoice.amount_paid || '0'),
    }), { totalAmount: 0, totalTax: 0, totalAmountPaid: 0 });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (filings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No filings found for this vendor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">GST Filings</h2>
      
      {filings.map((filing) => {
        const totals = calculateTotals(filing.invoices);
        const isExpanded = expandedFiling === filing.filing_id;
        
        return (
          <div key={filing.filing_id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Filing ID: {filing.filing_id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Period: {filing.filing_period} | Due: {formatDate(filing.due_date)}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {filing.invoices.length} Invoice{filing.invoices.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: {formatCurrency(totals.totalAmount)}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedFiling(isExpanded ? null : filing.filing_id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    {isExpanded ? 'Hide' : 'View'} Invoices
                  </button>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="px-6 py-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filing.invoices.map((invoice) => (
                        <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.invoice_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(invoice.invoice_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPaymentStatusBadge(invoice.payment_status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.total_tax)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.amount_paid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(invoice.total_amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan={4} className="px-6 py-4 text-sm text-gray-900">
                          Total ({filing.invoices.length} invoices)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(totals.totalAmount - totals.totalTax)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(totals.totalTax)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(totals.totalAmountPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(totals.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GSTFilings;