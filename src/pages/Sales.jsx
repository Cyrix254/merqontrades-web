import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import ReceiptDialog from "../components/ReceiptDialog";
import { formatMoney, getErrorMessage } from "../utils";

export default function Sales() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [sales, setSales] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await api.get("/sales", { params });
      setSales(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const openReceipt = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setReceipt(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const revenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const profit = sales.reduce((sum, s) => sum + Number(s.total_profit ?? 0), 0);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {isAdmin ? "Sales" : "My sales"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            type="date"
            label="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button onClick={() => { setFrom(""); setTo(""); }}>Clear</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: isAdmin ? "repeat(3, 1fr)" : "repeat(2, 1fr)" }, mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">Sales shown</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{sales.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">Revenue</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatMoney(revenue)}</Typography>
        </Paper>
        {isAdmin && (
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">Profit</Typography>
            <Typography variant="h5" color="success.main" sx={{ fontWeight: 700 }}>{formatMoney(profit)}</Typography>
          </Paper>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt</TableCell>
                <TableCell>Date</TableCell>
                {isAdmin && <TableCell>Served by</TableCell>}
                <TableCell align="right">Items</TableCell>
                <TableCell align="right">Total</TableCell>
                {isAdmin && <TableCell align="right">Profit</TableCell>}
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 5} align="center">No sales found.</TableCell>
                </TableRow>
              )}
              {sales.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>#{String(s.id).padStart(5, "0")}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleString()}</TableCell>
                  {isAdmin && <TableCell>{s.user?.name}</TableCell>}
                  <TableCell align="right">{s.items_count}</TableCell>
                  <TableCell align="right">{formatMoney(s.total_amount)}</TableCell>
                  {isAdmin && <TableCell align="right">{formatMoney(s.total_profit)}</TableCell>}
                  <TableCell align="right">
                    <Button size="small" onClick={() => openReceipt(s.id)}>Receipt</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {receipt && <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}