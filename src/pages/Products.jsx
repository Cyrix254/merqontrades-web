import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Paper, Snackbar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import { formatMoney, getErrorMessage } from "../utils";

function ProductDialog({ product, categories, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category_id: product?.category_id ?? "",
    cost_price: product?.cost_price ?? "",
    selling_price: product?.selling_price ?? "",
    quantity: "0",
    low_stock_threshold: product?.low_stock_threshold ?? 5,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async () => {
    setError("");
    setSaving(true);
    const payload = {
      name: form.name,
      sku: form.sku || null,
      category_id: form.category_id || null,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      low_stock_threshold: form.low_stock_threshold,
    };
    // Quantity is only set when creating; afterwards it changes through stock-in and sales
    if (!isEdit) payload.quantity = form.quantity || 0;

    try {
      if (isEdit) await api.put(`/products/${product.id}`, payload);
      else await api.post("/products", payload);
      onSaved(isEdit ? "Product updated." : "Product added.");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TextField label="Product name" fullWidth margin="dense" required value={form.name} onChange={change("name")} />
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField label="SKU / code (optional)" margin="dense" value={form.sku} onChange={change("sku")} />
          <TextField select label="Category" margin="dense" value={form.category_id} onChange={change("category_id")}>
            <MenuItem value="">None</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Cost price"
            type="number"
            margin="dense"
            required
            value={form.cost_price}
            onChange={change("cost_price")}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
          />
          <TextField
            label="Selling price"
            type="number"
            margin="dense"
            required
            value={form.selling_price}
            onChange={change("selling_price")}
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
          />
          {!isEdit && (
            <TextField
              label="Opening quantity"
              type="number"
              margin="dense"
              value={form.quantity}
              onChange={change("quantity")}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          )}
          <TextField
            label="Low-stock alert at"
            type="number"
            margin="dense"
            value={form.low_stock_threshold}
            onChange={change("low_stock_threshold")}
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || !form.name.trim() || form.cost_price === "" || form.selling_price === ""}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StockChip({ product }) {
  if (product.quantity === 0) return <Chip size="small" color="error" label="Out of stock" />;
  if (product.is_low_stock) return <Chip size="small" color="warning" label="Low stock" />;
  return <Chip size="small" color="success" variant="outlined" label="In stock" />;
}

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null); // null = closed, {} = new, product = edit
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.get("/products"), api.get("/categories")]);
      setProducts(p.data);
      setCategories(c.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleSaved = (text) => {
    setDialog(null);
    setMessage(text);
    load();
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setMessage("Product deleted.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const columns = isAdmin ? 8 : 6;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Products</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="Search name or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
              },
            }}
          />
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({})}>
              Add product
            </Button>
          )}
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
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                {isAdmin && <TableCell align="right">Cost price</TableCell>}
                <TableCell align="right">Selling price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns} align="center">
                    {products.length === 0 ? "No products yet." : "No products match your search."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.sku ?? "-"}</TableCell>
                  <TableCell>{p.category?.name ?? "-"}</TableCell>
                  {isAdmin && <TableCell align="right">{formatMoney(p.cost_price)}</TableCell>}
                  <TableCell align="right">{formatMoney(p.selling_price)}</TableCell>
                  <TableCell align="right">{p.quantity}</TableCell>
                  <TableCell><StockChip product={p} /></TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton onClick={() => setDialog(p)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(p)}><DeleteIcon /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialog && (
        <ProductDialog
          key={dialog.id ?? "new"}
          product={dialog.id ? dialog : null}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </>
  );
}