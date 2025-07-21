// const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = 'https://gst-service-g776.onrender.com';

export interface Vendor {
  gstin: string;
  name: string;
  merchant_type: string;
  state: string;
  created_at: string;
  is_itc_optedin: boolean;
  turnover: string;
}

export interface Product {
  sku: string;
  product_name: string;
  category: string;
  unit_price: string;
  quantity: number;
  discount_percent: string;
  price_after_discount: string;
  cgst: string;
  sgst: string;
  igst: string;
  buying_price: string;
}

export interface Invoice {
  invoice_id: string;
  date: string;
  amount: string;
  buying_price: string;
  cgst: string;
  sgst: string;
  igst: string;
  state: string;
  net_amount: string;
  itc: string;
  status: string;
  payment_status: string;
  amount_paid: string;
  products: Product[];
}

export interface Filing {
  gstin: string;
  vendor_name: string;
  timeframe: string;
  filing_start_date: string;
  filing_end_date: string;
  due_date: string;
  filed_at: string;
  is_late: boolean;
  status: string;
  total_amount: string;
  total_tax: string;
  invoice_count: number;
  input_tax_credit: string;
  tax_payable: string;
  penalty: string;
  total_payable_amount: string;
  invoices: Invoice[];
}

export interface LedgerEntry {
  id: number;
  gstin: string;
  txn_type: string;
  igst: string;
  cgst: string;
  sgst: string;
  txn_date: string;
  txn_reason: string;
  effective_from: string;
}

export interface Balance {
  gstin: string;
  igst_balance: string;
  cgst_balance: string;
  sgst_balance: string;
  updated_at: string;
}

export interface CreditNote {
  id: number;
  gstin: string;
  invoice_ref_id: number;
  invoice_id: string;
  invoice_date: string;
  credit_note_date: string;
  reason: string;
  amount: string;
  cgst: string;
  sgst: string;
  igst: string;
  net_amount: string;
}

export interface ApiResponse<T> {
  data: T;
}

export const apiService = {
  async getVendors(): Promise<Vendor[]> {
    const response = await fetch(`${API_BASE_URL}/vendors`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }
    const result: ApiResponse<Vendor[]> = await response.json();
    return result.data;
  },

  async getFilingsByGstin(gstin: string): Promise<Filing[]> {
    const response = await fetch(`${API_BASE_URL}/filings-with-invoices/${gstin}`);
    if (!response.ok) {
      throw new Error('Failed to fetch filings');
    }
    const result: ApiResponse<Filing[]> = await response.json();
    return result.data;
  },

  async getAllFilings(): Promise<Filing[]> {
    const response = await fetch(`${API_BASE_URL}/filings-with-invoices`);
    if (!response.ok) {
      throw new Error('Failed to fetch all filings');
    }
    const result: ApiResponse<Filing[]> = await response.json();
    return result.data;
  },

  async getLedger(gstin: string): Promise<LedgerEntry[]> {
    const response = await fetch(`${API_BASE_URL}/ledger/${gstin}`);
    if (!response.ok) {
      throw new Error('Failed to fetch ledger');
    }
    const result: ApiResponse<LedgerEntry[]> = await response.json();
    return result.data;
  },

  async getBalance(gstin: string): Promise<Balance> {
    const response = await fetch(`${API_BASE_URL}/balance/${gstin}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.status}`);
    }
    const result: ApiResponse<Balance> = await response.json();
    console.log('Balance API response:', result); // Debug log
    return result.data;
  },

  async getCreditNotes(gstin: string): Promise<CreditNote[]> {
    const response = await fetch(`${API_BASE_URL}/credit-notes/${gstin}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ledger: ${response.status}`);
    }
    const result: ApiResponse<CreditNote[]> = await response.json();
    console.log('Credit Notes API response:', result); // Debug log
    console.log('Ledger API response:', result); // Debug log
    return result.data;
  },
};