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
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountNames, setAccountNames] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [customerToAccountMap, setCustomerToAccountMap] = useState({});

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
        const [invoicesResponse, receiptsResponse, accountsResponse] = await Promise.all([
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
          }),
          fetch(`${API}/customer`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (!invoicesResponse.ok || !receiptsResponse.ok || !accountsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const invoicesData = await invoicesResponse.json();
        const receiptsData = await receiptsResponse.json();
        const accountsData = await accountsResponse.json();

        setInvoices(invoicesData);
        setCashReceipts(receiptsData);
        setAccountNames(accountsData.map(account => account.account_name));

        const map = {};
        accountsData.forEach(account => {
          account.sub_account_details.forEach(subAccount => {
            map[subAccount.name] = account.account_name;
          });
        });
        setCustomerToAccountMap(map);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!invoices.length || !cashReceipts.length || !Object.keys(customerToAccountMap).length) return;

    // Aggregate receipts by customer and payment type
    const receiptsByCustomerAndType = cashReceipts.reduce((acc, receipt) => {
      const customer = receipt.from_whom_received || receipt.name || 'Unknown';
      const receiptType = receipt.receipt_type || 'Unknown';
      if (!acc[customer]) acc[customer] = { invoiced: 0, cash: 0 };
      const receiptAmount = (parseFloat(receipt.cash) || 0) + (parseFloat(receipt.bank) || 0);
      if (receiptType === 'Invoiced') {
        acc[customer].invoiced += receiptAmount;
      } else if (receiptType === 'Cash') {
        acc[customer].cash += receiptAmount;
      }
      return acc;
    }, {});

    // Aggregate invoices by customer
    const invoicesByCustomer = invoices.reduce((acc, invoice) => {
      const customer = invoice.name || 'Unknown';
      if (!acc[customer]) acc[customer] = 0;
      const invoiceAmount = parseFloat(invoice.amount) || 0;
      acc[customer] += invoiceAmount;
      return acc;
    }, {});

    // Get unique customers from both invoices and receipts
    const allCustomers = new Set([
      ...Object.keys(invoicesByCustomer),
      ...Object.keys(receiptsByCustomerAndType)
    ]);

    // Create account data for each unique customer
    const accountData = Array.from(allCustomers).map(customer => {
      const invoiceAmount = invoicesByCustomer[customer] || 0;
      const receipts = receiptsByCustomerAndType[customer] || { invoiced: 0, cash: 0 };
      const totalReceipts = receipts.invoiced + receipts.cash;
      return {
        customerName: customer,
        accountName: customerToAccountMap[customer] || 'Unknown',
        invoiceAmount,
        receiptAmount: totalReceipts,
        receiptsInvoiced: receipts.invoiced,
        receiptsCash: receipts.cash,
        remainingBalance: Math.max(0, invoiceAmount - receipts.invoiced),
        overpayment: Math.max(0, receipts.invoiced - invoiceAmount),
        hasInvoice: invoiceAmount > 0,
        hasReceipt: totalReceipts > 0
      };
    });

    setAccountBalances(accountData);
    setLoading(false);
  }, [invoices, cashReceipts, customerToAccountMap]);

  const filteredBalances = accountBalances.filter(account => {
    const matchesSearch = account.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccount ? account.accountName === selectedAccount : true;
    let matchesFilter = true;
    if (filter === 'outstanding') {
      matchesFilter = account.remainingBalance > 0;
    } else if (filter === 'overpaid') {
      matchesFilter = account.overpayment > 0;
    } else if (filter === 'receiptOnly') {
      matchesFilter = !account.hasInvoice && account.hasReceipt;
    }
    return matchesSearch && matchesAccount && matchesFilter;
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
          <label htmlFor="account" style={{ marginRight: '10px' }}>Account:</label>
          <select
            id="account"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">All Accounts</option>
            {accountNames.map((name, index) => (
              <option key={index} value={name}>{name}</option>
            ))}
          </select>
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
            <option value="receiptOnly">Cash Receipts</option>
          </select>
        </div>
      </div>
      <div style={{ overflowX: 'auto', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Customer Name</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Invoice Amount</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Receipts (Invoiced)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Receipts (Cash)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total Receipts</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Remaining Balance</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Overpayment</th>
            </tr>
          </thead>
          <tbody>
            {filteredBalances.map((account, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd', backgroundColor: index % 2 ? '#f9f9f9' : 'white' }}>
                <td style={{ padding: '12px' }}>{account.customerName}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.invoiceAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.receiptsInvoiced.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.receiptsCash.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>KES {account.receiptAmount.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: account.remainingBalance > 0 ? 'red' : 'inherit' }}>
                  KES {account.remainingBalance.toFixed(2)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', color: account.overpayment > 0 ? 'blue' : 'inherit' }}>
                  KES {account.overpayment.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '30px', padding: '15px', background: 'black', color: 'white', borderRadius: '5px' }}>
        <h3>Summary</h3>
        <p>Total Invoices: KES {filteredBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0).toFixed(2)}</p>
        <p>Total Receipts (Invoiced): KES {filteredBalances.reduce((sum, acc) => sum + acc.receiptsInvoiced, 0).toFixed(2)}</p>
        <p>Total Receipts (Cash): KES {filteredBalances.reduce((sum, acc) => sum + acc.receiptsCash, 0).toFixed(2)}</p>
        <p>Total Receipts: KES {filteredBalances.reduce((sum, acc) => sum + acc.receiptAmount, 0).toFixed(2)}</p>
        <p>
          Total Outstanding: KES {
            (filteredBalances.reduce((sum, acc) => sum + acc.invoiceAmount, 0) -
             filteredBalances.reduce((sum, acc) => sum + acc.receiptsInvoiced, 0))
            .toFixed(2)
          }
        </p>
        <p style={{ fontWeight: 'bold' }}>
          Total Overpayment: KES {filteredBalances.reduce((sum, acc) => sum + acc.overpayment, 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default Debtors;
