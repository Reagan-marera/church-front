import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';

const API = 'https://backend.youmingtechnologies.co.ke';

const TransactionHistory = () => {
  const { type, name } = useParams();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        let transactionDetails = [];
        let runningBalance = 0;

        if (type === 'debtor') {
          const [invoicesResponse, receiptsResponse] = await Promise.all([
            fetch(`${API}/invoices`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            }),
            fetch(`${API}/cash-receipt-journals`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            }),
          ]);

          if (!invoicesResponse.ok || !receiptsResponse.ok) {
            throw new Error('Failed to fetch debtor data');
          }

          const invoices = await invoicesResponse.json();
          const receipts = await receiptsResponse.json();

          const customerInvoices = invoices
            .filter(inv => inv.name === name)
            .map(inv => ({
              date: moment(inv.date),
              details: `Invoice #${inv.invoice_number}`,
              required: parseFloat(inv.amount) || 0,
              paid: 0,
            }));

          const customerReceipts = receipts
            .filter(r => r.from_whom_received === name)
            .map(r => ({
              date: moment(r.date),
              details: `Payment - ${r.description}`,
              required: 0,
              paid: (parseFloat(r.cash) || 0) + (parseFloat(r.bank) || 0),
            }));

          transactionDetails = [...customerInvoices, ...customerReceipts];

        } else if (type === 'creditor') {
          const [invoicesReceivedResponse, disbursementsResponse] = await Promise.all([
            fetch(`${API}/invoice-received`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            }),
            fetch(`${API}/cash-disbursement-journals`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            }),
          ]);

          if (!invoicesReceivedResponse.ok || !disbursementsResponse.ok) {
            throw new Error('Failed to fetch creditor data');
          }

          const invoices = await invoicesReceivedResponse.json();
          const disbursements = await disbursementsResponse.json();

          const supplierInvoices = invoices
            .filter(inv => inv.name === name)
            .map(inv => ({
              date: moment(inv.date),
              details: `Invoice Received #${inv.invoice_number}`,
              required: parseFloat(inv.amount) || 0,
              paid: 0,
            }));

          const supplierDisbursements = disbursements
            .filter(d => d.to_whom_paid === name)
            .map(d => ({
              date: moment(d.date),
              details: `Payment - ${d.description}`,
              required: 0,
              paid: (parseFloat(d.cash) || 0) + (parseFloat(d.bank) || 0),
            }));

          transactionDetails = [...supplierInvoices, ...supplierDisbursements];
        }

        transactionDetails.sort((a, b) => a.date.valueOf() - b.date.valueOf());

        const processedTransactions = transactionDetails.map(t => {
          runningBalance += t.required - t.paid;
          return { ...t, balance: runningBalance };
        });

        setTransactions(processedTransactions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [type, name]);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textTransform: 'capitalize' }}>{type} Statement for: {name}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
        <thead>
          <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Required</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Paid</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
              <td style={{ padding: '12px' }}>{t.date.isValid() ? t.date.format('L') : 'Invalid Date'}</td>
              <td style={{ padding: '12px' }}>{t.details}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{t.required > 0 ? `KES ${t.required.toFixed(2)}` : '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{t.paid > 0 ? `KES ${t.paid.toFixed(2)}` : '-'}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>KES {t.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;