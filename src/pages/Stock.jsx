import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import api from "../api";
import { getErrorMessage } from "../utils";

const TYPE_LABELS = { stock_in: "Stock in", adjustment: "Adjustment", sale: "Sale" };
const TYPE_COLORS = { stock_in: "success", adjustment: "warning", sale: "info" };

function StockDialog({ products, onClose, onSaved }) {
  const [form, setForm] = useState({
    product_id: "",
    type: "stock_in",
    direction: "increase",
    quantity: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const isAdjustment = form.type === "adjustment";
  const selected = products.find((p) => p.id === form.product_id);

  const valid =
    form.product_id !== "" &&
    Number(form.quantity) >= 1 &&
    (!isAdjustment || form.reason.trim() !== "");

  const submit = async () => {
    setError("");
    setSaving(true);
    const quantity = Number(form.quantity);
    const signed = isAdjustment && form.direction === "decrease" ? -quantity : quantity;
    try {
      await api.post("/stock-movements", {
        product_id: form.product_id,
        type: form.type,
        quantity_change: signed,
        reason: form.reason.trim() || null,
      });
      onSaved("Stock updated.");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record stock change</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        <TextField
          select
          label="Product"
          fullWidth
          margin="dense"
          value={form.product_id}
          onChange={change("product_id")}
          helperText={selected ? `Currently in stock: ${selected.quantity}` : " "}
        >
          {products.map((p) => (
            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
          ))}
        </TextField>

        <TextField select label="Type" fullWidth margin="dense" value={form.type} onChange={change("type")}>
          <MenuItem value="stock_in">Stock in (goods received)</MenuItem>
          <MenuItem value="adjustment">Adjustment (damage, expiry, correction)</MenuItem>
        </TextField>

        {isAdjustment && (
          <TextField select label="Direction" fullWidth margin="dense" value={form.direction} onChange={change("direction")}>
            <MenuItem value="increase">Increase stock</MenuItem>
            <MenuItem value="decrease">Decrease stock</MenuItem>
          </TextField>
        )}

        <TextField
          label="Quantity"
          type="number"
          fullWidth
          margin="dense"
          value={form.quantity}
          onChange={change("quantity")}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />

        <TextField
          label={isAdjustment ? "Reason (required)" : "Note (optional)"}
          fullWidth
          margin="dense"
          value={form.reason}
          onChange={change("reason")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !valid}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Stock() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");

  const loadMovements = useCallback(async () => {
    try {
      const res = await api.get("/stock-movements", {
        params: productFilter ? { product_id: productFilter } : {},
      });
      setMovements(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [productFilter]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSaved = (text) => {
    setDialogOpen(false);
    setMessage(text);
    loadMovements();
    loadProducts();
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Stock</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            select
            size="small"
            label="Filter by product"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All products</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Record stock change
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No stock movements yet.</TableCell>
                </TableRow>
              )}
              {movements.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell>{m.product?.name}</TableCell>
                  <TableCell>
                    <Chip size="small" color={TYPE_COLORS[m.type] ?? "default"} label={TYPE_LABELS[m.type] ?? m.type} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 600, color: m.quantity_change > 0 ? "success.main" : "error.main" }}
                  >
                    {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </TableCell>
                  <TableCell>{m.reason ?? "-"}</TableCell>
                  <TableCell>{m.user?.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialogOpen && (
        <StockDialog products={products} onClose={() => setDialogOpen(false)} onSaved={handleSaved} />
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </>
  );
}