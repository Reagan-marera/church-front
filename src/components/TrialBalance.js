import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import "./trialbalance.css";

const TrialBalance = () => {
  const [trialBalance, setTrialBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch trial balance data from the backend
  useEffect(() => {
    const fetchTrialBalance = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/trial-balance");
        if (!response.ok) {
          throw new Error("Failed to fetch trial balance data");
        }
        const data = await response.json();
        setTrialBalance(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialBalance();
  }, []);

  if (loading) {
    return (
      <Box className="trial-balance-loading">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="trial-balance-error">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="trial-balance-container">
      <Typography variant="h4" gutterBottom className="trial-balance-title">
        Trial Balance
      </Typography>
      <TableContainer component={Paper} className="trial-balance-table-container">
        <Table>
          <TableHead className="trial-balance-table-header">
            <TableRow>
              <TableCell className="trial-balance-table-header-cell">Account</TableCell>
              <TableCell className="trial-balance-table-header-cell" align="right">
                Total Debits
              </TableCell>
              <TableCell className="trial-balance-table-header-cell" align="right">
                Total Credits
              </TableCell>
              <TableCell className="trial-balance-table-header-cell" align="right">
                Closing Balance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trialBalance.map((row, index) => (
              <TableRow key={index} className="trial-balance-table-row">
                <TableCell className="trial-balance-table-cell">{row.account}</TableCell>
                <TableCell className="trial-balance-table-cell" align="right">
                  {row.total_debits.toFixed(2)}
                </TableCell>
                <TableCell className="trial-balance-table-cell" align="right">
                  {row.total_credits.toFixed(2)}
                </TableCell>
                <TableCell className="trial-balance-table-cell" align="right">
                  {row.closing_balance.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TrialBalance;