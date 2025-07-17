import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiService, Balance, LedgerEntry, CreditNote } from '../services/api';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, IndianRupee, Calendar, FileText, CreditCard, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const VendorDetails: React.FC = () => {
  const { gstin } = useParams<{ gstin: string }>();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'balance' | 'ledger' | 'credit-notes'>('balance');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!gstin) return;

      try {
        setLoading(true);
        const [balanceData, ledgerData, creditNotesData] = await Promise.all([
          apiService.getBalance(gstin),
          apiService.getLedger(gstin),
          apiService.getCreditNotes(gstin),
        ]);
        
        setBalance(balanceData);
        setLedger(ledgerData);
        setCreditNotes(creditNotesData);
      } catch (err) {
        setError('Failed to fetch vendor details. Please try again.');
        console.error('Error fetching vendor details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gstin]);

  const formatCurrency = (amount: string) => {
    // Handle null, undefined, or invalid values
    if (!amount || amount === 'null' || amount === 'undefined' || isNaN(parseFloat(amount))) {
      return '₹0.00';
    }
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit':
      case 'payment':
        return 'text-green-600';
      case 'debit':
      case 'invoice':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const sortLedger = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ field, direction });

    const sortedLedger = [...ledger].sort((a, b) => {
      let aValue: any = a[field as keyof LedgerEntry];
      let bValue: any = b[field as keyof LedgerEntry];

      if (field === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (['debit', 'credit', 'balance'].includes(field)) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setLedger(sortedLedger);
  };

  const getSortIcon = (field: string) => {
    if (!sortConfig || sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading vendor details...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <IndianRupee className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Financial Details</h1>
          <p className="text-gray-600">GSTIN: {gstin}</p>
          {balance && <p className="text-sm text-gray-500">{balance.vendor_name}</p>}
        </div>
      </div>

      {/* Balance Overview */}
      {balance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance.current_balance)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Type: <span className="capitalize">{balance.balance_type}</span>
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Credits</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(balance.total_credits)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Debits</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(balance.total_debits)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Balance Summary
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ledger'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ledger ({ledger.length})
            </button>
            <button
              onClick={() => setActiveTab('credit-notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'credit-notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Credit Notes ({creditNotes.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balance' && balance && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Balance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">Last Updated</p>
                    <p className="font-medium text-blue-900">{formatDateTime(balance.last_updated)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Balance Type</p>
                    <p className="font-medium text-blue-900 capitalize">{balance.balance_type}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => sortLedger('date')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Date</span>
                          {getSortIcon('date')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => sortLedger('debit')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Debit</span>
                          {getSortIcon('debit')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => sortLedger('credit')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Credit</span>
                          {getSortIcon('credit')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        <button
                          onClick={() => sortLedger('balance')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Balance</span>
                          {getSortIcon('balance')}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ledger.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{entry.description}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`font-medium capitalize ${getTransactionTypeColor(entry.transaction_type || '')}`}>
                            {entry.transaction_type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">
                          {parseFloat(entry.debit) > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">
                          {parseFloat(entry.credit) > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                          {formatCurrency(entry.balance)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {entry.reference_id || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'credit-notes' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Credit Note ID</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CGST</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SGST</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">IGST</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {creditNotes.map((note) => (
                      <tr key={note.credit_note_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{note.credit_note_id}</td>
                        <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">{note.invoice_id}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{formatDate(note.date)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">{formatCurrency(note.amount)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(note.cgst)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(note.sgst)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">{formatCurrency(note.igst)}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">{formatCurrency(note.net_amount)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                            {note.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">{note.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;