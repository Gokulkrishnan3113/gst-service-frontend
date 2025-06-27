const API_BASE_URL = 'http://localhost:8080';

export interface Vendor {
  gstin: string;
  name: string;
  merchant_type: string;
  state: string;
  created_at: string;
  is_itc_optedin: boolean;
  turnover: string;
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
}

export interface Filing {
  gstin: string;
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
};