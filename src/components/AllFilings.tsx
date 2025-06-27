import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, Filing } from '../services/api';
import { FileText, Loader2, AlertCircle, ChevronDown, ChevronRight, Calendar, IndianRupee, AlertTriangle, ExternalLink, CreditCard, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const AllFilings: React.FC = () => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiling, setExpandedFiling] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ [key: string]: 'asc' | 'desc' | null }>({});

  useEffect(() => {
    const fetchFilings = async () => {
      try {
        setLoading(true);
        const data = await apiService.getAllFilings();
        setFilings(data);
      } catch (err) {
        setError('No Filings found for this GSTIN.');
        console.error('Error fetching filings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilings();
  }, []);

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpanded = (filingId: string) => {
    setExpandedFiling(expandedFiling === filingId ? null : filingId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sortInvoices = (filingId: string, field: string) => {
    const currentSort = sortConfig[filingId];
    let newSort: 'asc' | 'desc' = 'asc';

    if (currentSort === 'asc') {
      newSort = 'desc';
    } else if (currentSort === 'desc') {
      newSort = 'asc';
    }

    setSortConfig({ ...sortConfig, [filingId]: newSort });

    setFilings(prevFilings =>
      prevFilings.map(filing => {
        if (`${filing.gstin}-${filings.indexOf(filing)}` === filingId) {
          const sortedInvoices = [...filing.invoices].sort((a, b) => {
            const aValue = parseFloat(a[field as keyof typeof a] as string);
            const bValue = parseFloat(b[field as keyof typeof b] as string);

            if (newSort === 'asc') {
              return aValue - bValue;
            } else {
              return bValue - aValue;
            }
          });

          return { ...filing, invoices: sortedInvoices };
        }
        return filing;
      })
    );
  };

  const getSortIcon = (filingId: string) => {
    const currentSort = sortConfig[filingId];
    if (currentSort === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    } else if (currentSort === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading all filings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (filings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4 text-center">
          <FileText className="h-12 w-12 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">No filings found</h3>
            <p className="text-gray-600">No GST filings exist in the system</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All GST Filings</h1>
            <p className="text-gray-600">Complete overview of all GST filings</p>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-blue-700 font-medium">{filings.length} Filings</span>
        </div>
      </div>

      <div className="space-y-4">
        {filings.map((filing, index) => {
          const filingId = `${filing.gstin}-${index}`;
          const isExpanded = expandedFiling === filingId;
          
          return (
            <div key={filingId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(filingId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/gst-filings/${filing.gstin}`}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{filing.gstin}</span>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(filing.status)}`}>
                          {filing.status}
                        </span>
                        {filing.is_late && (
                          <span className="inline-flex items-center space-x-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">Late</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(filing.filing_start_date)} - {formatDate(filing.filing_end_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IndianRupee className="h-4 w-4" />
                          <span>{formatCurrency(filing.total_amount)}</span>
                        </div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                          {filing.timeframe}
                        </span>
                        {filing.filed_at && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">Filed: {formatDateTime(filing.filed_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{filing.invoice_count} Invoices</div>
                    <div className="text-sm text-gray-600">Invoice Due: {formatDate(filing.due_date)}</div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Total Tax</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(filing.total_tax)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Input Tax Credit</div>
                        <div className="text-lg font-semibold text-green-700">{formatCurrency(filing.input_tax_credit)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Tax Payable</div>
                        <div className="text-lg font-semibold text-orange-700">{formatCurrency(filing.tax_payable)}</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Penalty</div>
                        <div className="text-lg font-semibold text-red-700">{formatCurrency(filing.penalty)}</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Total Payable Amount</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{formatCurrency(filing.total_payable_amount)}</div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h4>
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                <button
                                  onClick={() => sortInvoices(filingId, 'amount')}
                                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                                >
                                  <span>Amount</span>
                                  {getSortIcon(filingId)}
                                </button>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buying Price</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ITC</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filing.invoices.map((invoice) => (
                              <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoice_id}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.date)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(invoice.amount)}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(invoice.buying_price)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(invoice.cgst)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(invoice.sgst)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(invoice.igst)}</td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(invoice.net_amount)}</td>
                                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(invoice.itc)}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{invoice.state}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllFilings;