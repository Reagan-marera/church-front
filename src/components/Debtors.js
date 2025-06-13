import React, { useState, useEffect } from 'react';

const API = 'https://backend.youmingtechnologies.co.ke';

const Debtors = () => {
  const [customerName, setCustomerName] = useState(null);
  const [journal, setJournal] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [cashReceipts, setCashReceipts] = useState([]);
  const [error, setError] = useState(null);
  const [accountBalances, setAccountBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'outstanding', 'overpaid'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setCustomerName('ExampleCustomer');
      setJournal({ total: 1000 });
    } else {
      setError("User is not authenticated");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesResponse, receiptsResponse] = await Promise.all([
          fetch(`${API}/invoices`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${API}/cash-receipt-journals`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (!invoicesResponse.ok || !receiptsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const invoicesData = await invoicesResponse.json();
        const receiptsData = await receiptsResponse.json();

        setInvoices(invoicesData);
        setCashReceipts(receiptsData);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!invoices.length && !cashReceipts.length) return;

    // Calculate total receipts per customer (from_whom_received)
    const receiptsByCustomer = cashReceipts.reduce((acc, receipt) => {
      const customer = receipt.from_whom_received || receipt.name || 'Unknown';
      if (!acc[customer]) {
        acc[customer] = 0;
      }
      // Use cash + bank amounts from receipt
      const receiptAmount = (parseFloat(receipt.cash) || 0) + (parseFloat(receipt.bank) || 0);
      acc[customer] += receiptAmount;
      return acc;
    }, {});

    // Calculate total invoice amounts per customer (name)
    const invoicesByCustomer = invoices.reduce((acc, invoice) => {
      const customer = invoice.name || 'Unknown';
      if (!acc[customer]) {
        acc[customer] = 0;
      }
      // Use amount from invoice
      const invoiceAmount = parseFloat(invoice.amount) || 0;
      acc[customer] += invoiceAmount;
      return acc;
    }, {});

    // Combine all unique customers from both invoices and receipts
    const allCustomers = new Set([
      ...invoices.map(inv => inv.name),
      ...cashReceipts.map(rec => rec.from_whom_received || rec.name)
    ].filter(Boolean));

    // Create account balances for each customer
    const accountData = Array.from(allCustomers).map(customer => {
      const invoiceAmount = invoicesByCustomer[customer] || 0;
      const receiptAmount = receiptsByCustomer[customer] || 0;
      
      return {
        customerName: customer,
        invoiceAmount,
        receiptAmount,
        clearedAmount: Math.min(invoiceAmount, receiptAmount),
        remainingBalance: Math.max(0, invoiceAmount - receiptAmount),
        overpayment: Math.max(0, receiptAmount - invoiceAmount),
        hasInvoice: invoiceAmount > 0,
        hasReceipt: receiptAmount > 0
      };
    });

    // Add customers who only have receipts (no invoices)
    const receiptOnlyCustomers = Object.keys(receiptsByCustomer)
      .filter(customer => !invoicesByCustomer[customer])
      .map(customer => ({
        customerName: customer,
        invoiceAmount: 0,
        receiptAmount: receiptsByCustomer[customer],
        clearedAmount: 0,
        remainingBalance: 0,
        overpayment: receiptsByCustomer[customer],
        hasInvoice: false,
        hasReceipt: true
      }));

    const combinedData = [...accountData, ...receiptOnlyCustomers];
    setAccountBalances(combinedData);
    setLoading(false);

  }, [invoices, cashReceipts]);

  const filteredBalances = accountBalances.filter(account => {
    // Apply search filter
    const matchesSearch = account.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'outstanding') {
      matchesFilter = account.remainingBalance > 0;
    } else if (filter === 'overpaid') {
      matchesFilter = account.overpayment > 0;
    } else if (filter === 'receiptOnly') {
      matchesFilter = !account.hasInvoice && account.hasReceipt;
    }
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Debtors Reconciliation</h2>
      
      <div style={{ margin: '20px 0' }}>
        <p>Journal Total: KES {journal?.total?.toFixed(2) || '0.00'}</p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label htmlFor="search" style={{ marginRight: '10px' }}>Search:</label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        
        <div>
          <label htmlFor="filter" style={{ marginRight: '10px' }}>Filter:</label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="all">All Customers</option>
            <option value="outstanding">With Outstanding Balances</option>
            <option value="overpaid">With Overpayments</option>
            <option value="receiptOnly">Cash Receipts </option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Invoice Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Receipt Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Cleared Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Balance</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Overpayment</th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.map((account, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '12px' }}>{account.customerName}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.invoiceAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.receiptAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.clearedAmount.toFixed(2)}</td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right',
                  color: account.remainingBalance > 0 ? 'red' : 'inherit'
                }}>
                  KES {account.remainingBalance.toFixed(2)}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'right',
                  color: account.overpayment > 0 ? 'blue' : 'inherit'
                }}>
                  KES {account.overpayment.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: 'black', color: 'white', borderRadius: '5px' }}>
        <h3>Summary</h3>
        <p>Total Invoices: KES {accountBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0).toFixed(2)}</p>
        <p>Total Receipts: KES {accountBalances.reduce((sum, acc) => sum + acc.receiptAmount, 0).toFixed(2)}</p>
        <p>Total Cleared: KES {accountBalances.reduce((sum, acc) => sum + acc.clearedAmount, 0).toFixed(2)}</p>
        <p>Total Outstanding: KES {accountBalances.reduce((sum, acc) => sum + acc.remainingBalance, 0).toFixed(2)}</p>
        <p style={{ fontWeight: 'bold' }}>
          Total Overpayment: KES {accountBalances.reduce((sum, acc) => sum + acc.overpayment, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Debtors;