import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, Filing } from '../services/api';
import { FileText, Loader2, AlertCircle, ChevronDown, ChevronRight, Calendar, IndianRupee, AlertTriangle, ExternalLink, CreditCard, ArrowUpDown, ArrowUp, ArrowDown, Package } from 'lucide-react';

const AllFilings: React.FC = () => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFiling, setExpandedFiling] = useState<string | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
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

  const calculateInvoiceTotals = (invoices: Filing['invoices']) => {
    const totals = {
      amount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      net_amount: 0,
      itc: 0,
    };

    invoices.forEach((invoice) => {
      totals.amount += parseFloat(invoice.amount);
      totals.cgst += parseFloat(invoice.cgst);
      totals.sgst += parseFloat(invoice.sgst);
      totals.igst += parseFloat(invoice.igst);
      totals.net_amount += parseFloat(invoice.net_amount);
      totals.itc += parseFloat(invoice.itc);
    });

    return totals;
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
    // Close any expanded invoices when collapsing filing
    if (expandedFiling === filingId) {
      setExpandedInvoices(new Set());
    }
  };

  const toggleInvoiceExpanded = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
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
    const currentSort = sortConfig[`${filingId}-${field}`];
    let newSort: 'asc' | 'desc' = 'asc';

    if (currentSort === 'asc') {
      newSort = 'desc';
    } else if (currentSort === 'desc') {
      newSort = 'asc';
    }

    setSortConfig({ ...sortConfig, [`${filingId}-${field}`]: newSort });

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

  const getSortIcon = (filingId: string, field: string) => {
    const currentSort = sortConfig[`${filingId}-${field}`];
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
          const name = filing.vendor_name;
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
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-blue-600">{name}</div>
                        </div>
                        <Link
                          to={`/gst-filings/${filing.gstin}`}
                          className="group flex items-center space-x-2 text-blue-600 hover:font-bold font-medium transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{filing.gstin}</span>
                          <ExternalLink className="h-4 w-4 group-hover:stroke-[3.0] transition-all" />
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
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => sortInvoices(filingId, 'amount')}
                                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                                  >
                                    <span>Amount </span>
                                    {getSortIcon(filingId, 'amount')}
                                  </button>
                                </div>
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Buying Price</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CGST</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SGST</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">IGST</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => sortInvoices(filingId, 'net_amount')}
                                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                                  >
                                    <span>Net Amount </span>
                                    {getSortIcon(filingId, 'net_amount')}
                                  </button>
                                </div>
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <div className="flex justify-center">

                                  <button
                                    onClick={() => sortInvoices(filingId, 'itc')}
                                    className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                                  >
                                    <span>ITC </span>
                                    {getSortIcon(filingId, 'itc')}
                                  </button>
                                </div>
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">State</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filing.invoices.map((invoice) => {
                              const invoiceId = `${filingId}-${invoice.invoice_id}`;
                              const isInvoiceExpanded = expandedInvoices.has(invoiceId);

                              return (
                                <React.Fragment key={invoice.invoice_id}>
                                  <tr
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={(e) => toggleInvoiceExpanded(invoiceId, e)}
                                  >
                                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                                      <div className="flex items-center justify-center space-x-2">
                                        {isInvoiceExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span>{invoice.invoice_id}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(invoice.date)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">{formatCurrency(invoice.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">{formatCurrency(invoice.buying_price)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(invoice.cgst)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(invoice.sgst)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(invoice.igst)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">{formatCurrency(invoice.net_amount)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">{formatCurrency(invoice.itc)}</td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">{invoice.state}</td>
                                  </tr>
                                  {isInvoiceExpanded && (
                                    <tr>
                                      <td colSpan={10} className="px-4 py-0">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
                                          <div className="flex items-center space-x-2 mb-3">
                                            <Package className="h-5 w-5 text-blue-600" />
                                            <h5 className="text-sm font-semibold text-blue-800">Product Details</h5>
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-blue-200">
                                              <thead className="bg-blue-100">
                                                <tr>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">SKU</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Product Name</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Category</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Unit Price</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Quantity</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Discount %</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Price After Discount</th>
                                                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-700 uppercase">Buying Price</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-blue-200">
                                                {invoice.products.map((product, productIndex) => (
                                                  <tr key={productIndex} className="bg-white">
                                                    <td className="px-3 py-2 text-xs font-medium text-gray-900">{product.sku}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{product.product_name}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-600">
                                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {product.category}
                                                      </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{formatCurrency(product.unit_price)}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900 font-medium">{product.quantity}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900">{product.discount_percent}%</td>
                                                    <td className="px-3 py-2 text-xs text-gray-900 font-medium">{formatCurrency(product.price_after_discount)}</td>
                                                    <td className="px-3 py-2 text-xs text-gray-700">{formatCurrency(product.buying_price)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            {(() => {
                              const totals = calculateInvoiceTotals(filing.invoices);
                              return (
                                <tr className="bg-blue-100 font-semibold text-gray-800">
                                  <td className="px-4 py-3 text-sm text-center" colSpan={1}>Total</td>
                                  <td className="px-4 py-3 text-sm text-center">--</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.amount.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">--</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.cgst.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.sgst.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.igst.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.net_amount.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">{formatCurrency(totals.itc.toFixed(2))}</td>
                                  <td className="px-4 py-3 text-sm text-center">--</td>
                                </tr>
                              );
                            })()}
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