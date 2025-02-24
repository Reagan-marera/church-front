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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Trial Balance
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Account</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Total Debits
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Total Credits
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Closing Balance
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trialBalance.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.account}</TableCell>
                <TableCell align="right">{row.total_debits.toFixed(2)}</TableCell>
                <TableCell align="right">{row.total_credits.toFixed(2)}</TableCell>
                <TableCell align="right">{row.closing_balance.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TrialBalance;