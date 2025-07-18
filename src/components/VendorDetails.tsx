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
  const [apiCallsCompleted, setApiCallsCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!gstin) return;

      console.log('Fetching data for GSTIN:', gstin);
      
      try {
        setLoading(true);
        setError(null);
        setApiCallsCompleted(false);
        
        console.log('Making API calls...');
        
        // Make API calls sequentially to better handle errors
        let balanceData = null;
        let ledgerData = [];
        let creditNotesData = [];
        
        try {
          console.log('Fetching balance...');
          balanceData = await apiService.getBalance(gstin);
          console.log('Balance response:', balanceData);
        } catch (balanceError) {
          console.error('Balance API error:', balanceError);
        }
        
        try {
          console.log('Fetching ledger...');
          ledgerData = await apiService.getLedger(gstin);
          console.log('Ledger response:', ledgerData);
        } catch (ledgerError) {
          console.error('Ledger API error:', ledgerError);
        }
        
        try {
          console.log('Fetching credit notes...');
          creditNotesData = await apiService.getCreditNotes(gstin);
          console.log('Credit notes response:', creditNotesData);
        } catch (creditError) {
          console.error('Credit notes API error:', creditError);
        }
        
        setApiCallsCompleted(true);
        
        setBalance(balanceData);
        setLedger(ledgerData || []);
        setCreditNotes(creditNotesData || []);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(`Failed to fetch vendor details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gstin]);

  const formatCurrency = (amount: string) => {
    // Handle null, undefined, or invalid values
    if (!amount || amount === 'null' || amount === 'undefined' || amount === '' || isNaN(parseFloat(amount))) {
      return '₹0.00';
    }
    const numericAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(numericAmount);
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

  const getTransactionTypeColor = (type: string) => {
    if (!type || typeof type !== 'string') {
      return 'text-gray-600';
    }
    switch (type.toLowerCase()) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateTotalBalance = () => {
    if (!balance) return '0';
    const igst = parseFloat(balance.igst_balance || '0');
    const cgst = parseFloat(balance.cgst_balance || '0');
    const sgst = parseFloat(balance.sgst_balance || '0');
    return (igst + cgst + sgst).toString();
  };

  const calculateLedgerTotals = () => {
    let totalCredits = 0;
    let totalDebits = 0;

    ledger.forEach(entry => {
      const igst = parseFloat(entry.igst || '0');
      const cgst = parseFloat(entry.cgst || '0');
      const sgst = parseFloat(entry.sgst || '0');
      const total = igst + cgst + sgst;

      if (entry.txn_type === 'CREDIT') {
        totalCredits += total;
      } else if (entry.txn_type === 'DEBIT') {
        totalDebits += total;
      }
    });

    return { totalCredits: totalCredits.toString(), totalDebits: totalDebits.toString() };
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

      if (field === 'txn_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (['igst', 'cgst', 'sgst'].includes(field)) {
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

  const ledgerTotals = calculateLedgerTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">
            {apiCallsCompleted ? 'Processing data...' : 'Loading vendor details...'}
          </p>
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
        </div>
      </div>

      {/* Balance Overview - Always show, even if data is null */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {balance ? formatCurrency(calculateTotalBalance()) : '₹0.00'}
              </p>
              <div className="text-xs text-gray-400 mt-1 space-y-1">
                <div>IGST: {balance ? formatCurrency(balance.igst_balance) : '₹0.00'}</div>
                <div>CGST: {balance ? formatCurrency(balance.cgst_balance) : '₹0.00'}</div>
                <div>SGST: {balance ? formatCurrency(balance.sgst_balance) : '₹0.00'}</div>
              </div>
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
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(ledgerTotals.totalCredits)}
              </p>
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
              <p className="text-2xl font-bold text-red-700">
                {formatCurrency(ledgerTotals.totalDebits)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

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
              {balance ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Balance Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-700">Last Updated</p>
                      <p className="font-medium text-blue-900">
                        {balance.updated_at ? formatDateTime(balance.updated_at) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">Total Balance</p>
                      <p className="font-medium text-blue-900">{formatCurrency(calculateTotalBalance())}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">IGST Balance</p>
                      <p className="font-medium text-blue-900">{formatCurrency(balance.igst_balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">CGST Balance</p>
                      <p className="font-medium text-blue-900">{formatCurrency(balance.cgst_balance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700">SGST Balance</p>
                      <p className="font-medium text-blue-900">{formatCurrency(balance.sgst_balance)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">No balance information available for this vendor.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {ledger && ledger.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => sortLedger('txn_date')}
                            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                          >
                            <span>Transaction Date</span>
                            {getSortIcon('txn_date')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reason</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => sortLedger('igst')}
                            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                          >
                            <span>IGST</span>
                            {getSortIcon('igst')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => sortLedger('cgst')}
                            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                          >
                            <span>CGST</span>
                            {getSortIcon('cgst')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          <button
                            onClick={() => sortLedger('sgst')}
                            className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                          >
                            <span>SGST</span>
                            {getSortIcon('sgst')}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Effective From</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ledger.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {entry.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {entry.txn_date ? formatDate(entry.txn_date) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {entry.txn_reason || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`font-medium capitalize ${getTransactionTypeColor(entry.txn_type || '')}`}>
                              {entry.txn_type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium">
                            {formatCurrency(entry.igst)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium">
                            {formatCurrency(entry.cgst)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center font-medium">
                            {formatCurrency(entry.sgst)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {entry.effective_from ? formatDate(entry.effective_from) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">No ledger entries found for this vendor.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'credit-notes' && (
            <div className="space-y-4">
              {creditNotes && creditNotes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice ID</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Credit Note Date</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">CGST</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SGST</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">IGST</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {creditNotes.map((note) => (
                        <tr key={note.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                            {note.id}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">
                            {note.invoice_id || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {note.invoice_date ? formatDate(note.invoice_date) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {note.credit_note_date ? formatDate(note.credit_note_date) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                            {formatCurrency(note.amount || '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {formatCurrency(note.cgst || '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {formatCurrency(note.sgst || '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {formatCurrency(note.igst || '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">
                            {formatCurrency(note.net_amount || '0')}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-600">
                            {note.reason || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">No credit notes found for this vendor.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;