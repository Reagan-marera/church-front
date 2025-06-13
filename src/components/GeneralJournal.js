import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const API_BASE_URL = 'https://backend.youmingtechnologies.co.ke';

const GeneralJournal = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const response = await fetch(`${API_BASE_URL}/get-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (error) {
      console.error('Fetch error:', error);
      setMessage(error.message);
      setMessageType('error');
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const processExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('File read successfully');
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('Workbook SheetNames:', workbook.SheetNames);
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get the range of the worksheet
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          
          // Extract headers from the first row
          const headers = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
            headers.push(cell ? cell.v : `__EMPTY_${C}`);
          }
          
          console.log('Extracted headers:', headers);
          
          // Convert to JSON with custom headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: headers });
          
          console.log('Processed Excel data:', jsonData);
          
          if (jsonData.length === 0) {
            throw new Error('Excel sheet is empty');
          }
          
          resolve(jsonData);
        } catch (error) {
          console.error('Processing error:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };
  
  const transformToTransactions = (excelData) => {
    console.log('Transforming Excel data to transactions...');
    
    // Skip the first row (headers)
    const dataRows = excelData.slice(1);
    
    const transactions = dataRows.map((row, index) => {
      // Debug: Log the entire row
      console.log(`Row ${index + 1}:`, row);
      
      // Find the correct property names (they might be in different columns)
      const accountDebited = row['ACCOUNT DEBITED'] || 
                           row['Account Debited'] || 
                           row['account debited'] ||
                           row[Object.keys(row).find(k => k.toLowerCase().includes('debit'))];
      
      const accountCredited = row['ACCOUNT CREDITED'] || 
                            row['Account Credited'] || 
                            row['account credited'] ||
                            row[Object.keys(row).find(k => k.toLowerCase().includes('credit'))];
      
      const description = row['DESRIPTION'] || 
                         row['DESCRIPTION'] || 
                         row['description'] || 
                         '';
      
      // Debug: Log extracted values
      console.log(`Row ${index + 1} values:`, {
        accountDebited,
        accountCredited,
        description,
        amountDebited: row['AMOUNT DEBITED'],
        amountCredited: row['AMOUNT CREDITED']
      });
      
      // Skip if required fields are missing
      if (!accountDebited || !accountCredited) {
        console.warn(`Skipping row ${index + 1} - missing account fields`);
        return null;
      }
      
      // Parse amounts (handle both string with commas and numbers)
      let amountDebited = 0;
      let amountCredited = 0;
      
      try {
        amountDebited = typeof row['AMOUNT DEBITED'] === 'string' 
          ? parseFloat(row['AMOUNT DEBITED'].replace(/,/g, '')) 
          : Number(row['AMOUNT DEBITED']) || 0;
          
        amountCredited = typeof row['AMOUNT CREDITED'] === 'string' 
          ? parseFloat(row['AMOUNT CREDITED'].replace(/,/g, '')) 
          : Number(row['AMOUNT CREDITED']) || 0;
      } catch (e) {
        console.error(`Error parsing amounts in row ${index + 1}:`, e);
      }
      
      return {
        debitedAccount: accountDebited.toString().trim(),
        creditedAccount: accountCredited.toString().trim(),
        description: description.toString().trim(),
        amountDebited,
        amountCredited,
        dateIssued: new Date().toISOString().split('T')[0] // Default to today
      };
    }).filter(transaction => transaction !== null);
    
    console.log('Transformed transactions:', transactions);
    return transactions;
  };
  // Upload transactions to API
  const uploadTransactions = async (transactions) => {
    setIsLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      console.log('Preparing to upload transactions:', transactions);
      
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User is not authenticated");

      const response = await fetch(`${API_BASE_URL}/bulk-upload-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transactions })
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload success response:', data);
      
      setMessage(`${transactions.length} transactions uploaded successfully`);
      setMessageType('success');
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error.message || 'Failed to upload transactions');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }
    
    try {
      console.log('Starting file processing...');
      const excelData = await processExcelFile(file);
      setExcelData(excelData); // Store for debugging
      
      const transactions = transformToTransactions(excelData);
      console.log('Final transactions to upload:', transactions);
      
      if (transactions.length === 0) {
        throw new Error('No valid transactions found in the file. Please check the format.');
      }
      
      await uploadTransactions(transactions);
    } catch (error) {
      console.error('Submission error:', error);
      setMessage(error.message);
      setMessageType('error');
    }
  };

  return (
    <div className="general-journal-container">
      <h2>General Journal Upload</h2>
      
      <div className="upload-instructions">
        <p>Upload an Excel file with these exact column headers:</p>
        <ul>
          <li>ACCOUNT DEBITED</li>
          <li>ACCOUNT CREDITED</li>
          <li>DESRIPTION (or DESCRIPTION)</li>
          <li>AMOUNT DEBITED</li>
          <li>AMOUNT CREDITED</li>
        </ul>
      </div>
      
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-upload">Select Excel File:</label>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={isLoading}
          />
        </div>
        
        <button type="submit" disabled={!file || isLoading}>
          {isLoading ? 'Processing...' : 'Upload Transactions'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${messageType}`}>
          {message}
          {messageType === 'error' && file && (
            <button 
              onClick={() => console.log('Debug data:', { file, excelData })}
              className="debug-button"
            >
              Show Debug Info
            </button>
          )}
        </div>
      )}
      
      <div className="transactions-list">
        <h3>Existing Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Debit Account</th>
              <th>Credit Account</th>
              <th>Description</th>
              <th>Debit Amount</th>
              <th>Credit Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td>{t.date_issued}</td>
                <td>{t.debited_account_name}</td>
                <td>{t.credited_account_name}</td>
                <td>{t.description}</td>
                <td>{t.amount_debited?.toLocaleString()}</td>
                <td>{t.amount_credited?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralJournal;