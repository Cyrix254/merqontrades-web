import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, CircularProgress, IconButton, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api";
import ReceiptDialog from "../components/ReceiptDialog";
import { formatMoney, getErrorMessage } from "../utils";

export default function NewSale() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // each entry: { product, quantity }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Only products that are in stock and not already in the cart
  const options = useMemo(
    () => products.filter((p) => p.quantity > 0 && !cart.some((c) => c.product.id === p.id)),
    [products, cart]
  );

  const total = cart.reduce((sum, c) => sum + c.product.selling_price * c.quantity, 0);

  const addProduct = (product) => {
    if (product) setCart([...cart, { product, quantity: 1 }]);
  };

  const setQuantity = (productId, value) => {
    setCart(
      cart.map((c) => {
        if (c.product.id !== productId) return c;
        const qty = Math.max(1, Math.min(c.product.quantity, parseInt(value, 10) || 1));
        return { ...c, quantity: qty };
      })
    );
  };

  const removeItem = (productId) => setCart(cart.filter((c) => c.product.id !== productId));

  const completeSale = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/sales", {
        items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
      });
      setReceipt(res.data);
      setCart([]);
      loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
      loadProducts(); // refresh in case stock changed
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>New sale</Typography>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Autocomplete
          key={cart.length} // resets the search box after each item is added
          options={options}
          value={null}
          blurOnSelect
          getOptionLabel={(p) => `${p.name}${p.sku ? ` (${p.sku})` : ""}`}
          renderOption={(props, p) => (
            <li {...props} key={p.id}>
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>{p.name}</span>
                <span>{formatMoney(p.selling_price)} · {p.quantity} in stock</span>
              </Box>
            </li>
          )}
          onChange={(e, p) => addProduct(p)}
          noOptionsText="No matching products in stock"
          renderInput={(params) => <TextField {...params} label="Search and add a product" />}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Quantity</TableCell>
              <TableCell align="right">Line total</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">The cart is empty. Search for a product above.</TableCell>
              </TableRow>
            )}
            {cart.map(({ product, quantity }) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">{formatMoney(product.selling_price)}</TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={quantity}
                    onChange={(e) => setQuantity(product.id, e.target.value)}
                    helperText={`Max ${product.quantity}`}
                    slotProps={{ htmlInput: { min: 1, max: product.quantity } }}
                  />
                </TableCell>
                <TableCell align="right">{formatMoney(product.selling_price * quantity)}</TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => removeItem(product.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, mt: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Total: {formatMoney(total)}</Typography>
        <Button
          variant="contained"
          size="large"
          disabled={cart.length === 0 || submitting}
          onClick={completeSale}
        >
          {submitting ? "Saving..." : "Complete sale"}
        </Button>
      </Box>

      {receipt && <ReceiptDialog sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}