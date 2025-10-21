import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import * as XLSX from 'xlsx';

const API = 'https://backend.youmingtechnologies.co.ke';

const TransactionHistory = () => {
  const { type, name } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API}/get-company-details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch company details');
        }
        const data = await response.json();
        setLogoUrl(data.logo);
        setCompanyName(data.company_name);
      } catch (err) {
        console.error('Error fetching company details:', err);
      }
    };
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('User not authenticated');
        }
        let transactionDetails = [];
        let runningBalance = 0;
        if (type === 'debtor') {
          const [invoicesResponse, receiptsResponse] = await Promise.all([
            fetch(`${API}/invoices`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API}/cash-receipt-journals`, { headers: { 'Authorization': `Bearer ${token}` } }),
          ]);
          if (!invoicesResponse.ok) throw new Error(`Failed to fetch invoices: ${invoicesResponse.statusText}`);
          if (!receiptsResponse.ok) throw new Error(`Failed to fetch cash receipts: ${receiptsResponse.statusText}`);
          const invoices = await invoicesResponse.json();
          const receipts = await receiptsResponse.json();
          const customerInvoices = invoices
            .filter(inv => inv.name === name)
            .map(inv => ({
              date: moment(inv.date_issued),
              rec_no: inv.invoice_number,
              details: inv.description || 'Invoice',
              required: parseFloat(inv.amount) || 0,
              paid: 0,
            }));
          const customerReceipts = receipts
            .filter(r => r.from_whom_received === name)
            .map(r => ({
              date: moment(r.receipt_date),
              rec_no: r.receipt_no || r.manual_number,
              details: `Payment - ${r.description || 'Cash/Bank Receipt'}`,
              required: 0,
              paid: (parseFloat(r.cash) || 0) + (parseFloat(r.bank) || 0),
            }));
          transactionDetails = [...customerInvoices, ...customerReceipts];
        } else if (type === 'creditor') {
          const [invoicesReceivedResponse, disbursementsResponse] = await Promise.all([
            fetch(`${API}/invoice-received`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API}/cash-disbursement-journals`, { headers: { 'Authorization': `Bearer ${token}` } }),
          ]);
          if (!invoicesReceivedResponse.ok) throw new Error('Failed to fetch received invoices');
          if (!disbursementsResponse.ok) throw new Error('Failed to fetch cash disbursements');
          const invoices = await invoicesReceivedResponse.json();
          const disbursements = await disbursementsResponse.json();
          const supplierInvoices = invoices
            .filter(inv => inv.name === name)
            .map(inv => ({
              date: moment(inv.date_issued),
              rec_no: inv.invoice_number,
              details: inv.description || 'Invoice Received',
              required: parseFloat(inv.amount) || 0,
              paid: 0,
            }));
          const supplierDisbursements = disbursements
            .filter(d => d.to_whom_paid === name)
            .map(d => ({
              date: moment(d.disbursement_date),
              rec_no: d.cheque_no || d.p_voucher_no,
              details: `Payment - ${d.description || 'Disbursement'}`,
              required: 0,
              paid: (parseFloat(d.cash) || 0) + (parseFloat(d.bank) || 0),
            }));
          transactionDetails = [...supplierInvoices, ...supplierDisbursements];
        }
        transactionDetails.sort((a, b) => a.date.valueOf() - b.date.valueOf());
        let initialBalance = 0;
        const processedTransactions = transactionDetails.map(t => {
          runningBalance += t.required - t.paid;
          return { ...t, balance: runningBalance };
        });
        setTransactions(processedTransactions);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [type, name]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map(t => ({
        Date: t.date.isValid() ? t.date.format('DD/MM/YYYY') : 'Invalid Date',
        'Rec. No.': t.rec_no,
        Details: t.details,
        Required: t.required > 0 ? `KES ${t.required.toFixed(2)}` : '-',
        Paid: t.paid > 0 ? `KES ${t.paid.toFixed(2)}` : '-',
        Balance: `KES ${t.balance.toFixed(2)}`,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, `${name}_${type}_statement.xlsx`);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {logoUrl && <img src={logoUrl} alt="Company Logo" style={{ maxWidth: '150px', maxHeight: '150px' }} />}
        <h1>{companyName}</h1>
        <h2 style={{ textTransform: 'capitalize' }}>{type} Statement</h2>
        <h3>For: {name}</h3>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Rec. No.</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Required</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Paid</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
              <td style={{ padding: '12px' }}>{t.date.isValid() ? t.date.format('DD/MM/YYYY') : 'Invalid Date'}</td>
              <td style={{ padding: '12px' }}>{t.rec_no}</td>
              <td style={{ padding: '12px' }}>{t.details}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{t.required > 0 ? `KES ${t.required.toFixed(2)}` : '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{t.paid > 0 ? `KES ${t.paid.toFixed(2)}` : '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>KES {t.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button
          onClick={handlePrint}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
        >
          Print Statement
        </button>
        <button
          onClick={handleExportToExcel}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Export to Excel
        </button>
      </div>
    </div>
  );
};

export default TransactionHistory;
