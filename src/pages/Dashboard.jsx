import { useEffect, useState } from "react";
import {
  Alert, Box, CircularProgress, List, ListItem, ListItemText, Paper, Typography,
} from "@mui/material";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../utils";

function StatCard({ label, value, color }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography variant="h3" color={color} sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/categories")])
      .then(([p, c]) => {
        setProducts(p.data);
        setCategories(c.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const lowStock = products.filter((p) => p.is_low_stock);

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Welcome, {user.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Here is where your stock stands today.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, mb: 3 }}>
        <StatCard label="Products" value={products.length} />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Low-stock items" value={lowStock.length} color={lowStock.length ? "warning.main" : "success.main"} />
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Needs restocking</Typography>
        {lowStock.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Nothing is running low.
          </Typography>
        ) : (
          <List dense>
            {lowStock.map((p) => (
              <ListItem key={p.id} divider>
                <ListItemText
                  primary={p.name}
                  secondary={`${p.quantity} left (alert at ${p.low_stock_threshold})`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </>
  );
}