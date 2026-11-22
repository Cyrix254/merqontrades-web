import { useEffect, useState } from "react";
import {
  Alert, Box, Chip, CircularProgress, List, ListItem, ListItemText, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import { formatMoney, getErrorMessage } from "../utils";

function Loading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
      <CircularProgress />
    </Box>
  );
}

function PeriodCard({ title, data }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {formatMoney(data.revenue)}
      </Typography>
      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
        Profit {formatMoney(data.profit)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {data.sales_count} {data.sales_count === 1 ? "sale" : "sales"}
      </Typography>
    </Paper>
  );
}

function DailyChart({ data }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        {data.map((d) => {
          const pct = (d.revenue / max) * 100;
          const profitPct = d.revenue > 0 ? (Math.max(d.profit, 0) / d.revenue) * 100 : 0;
          const label = new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
          });

          return (
            <Box key={d.date} sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ height: 180, display: "flex", alignItems: "flex-end" }}>
                <Tooltip title={`Revenue ${formatMoney(d.revenue)} · Profit ${formatMoney(d.profit)}`}>
                  <Box
                    sx={{
                      width: "100%",
                      height: `${pct}%`,
                      minHeight: d.revenue > 0 ? 4 : 0,
                      bgcolor: "primary.main",
                      borderRadius: "4px 4px 0 0",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: `${profitPct}%`,
                        bgcolor: "success.main",
                        borderRadius: "0 0 0 0",
                      }}
                    />
                  </Box>
                </Tooltip>
              </Box>
              <Typography variant="caption" color="text.secondary" align="center" display="block" noWrap>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
        <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box component="span" sx={{ width: 10, height: 10, bgcolor: "primary.main", borderRadius: 0.5 }} />
          Revenue
        </Typography>
        <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box component="span" sx={{ width: 10, height: 10, bgcolor: "success.main", borderRadius: 0.5 }} />
          Profit (part of revenue)
        </Typography>
      </Box>
    </Box>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/reports/summary")
      .then((res) => setReport(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!report) return <Loading />;

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>Welcome, {user.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Here is how the business is doing.
      </Typography>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, mb: 3 }}>
        <PeriodCard title="Today" data={report.totals.today} />
        <PeriodCard title="This week" data={report.totals.week} />
        <PeriodCard title="This month" data={report.totals.month} />
      </Box>

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Last 7 days</Typography>
        <DailyChart data={report.daily} />
      </Paper>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" } }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6">Top sellers (last 30 days)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Units</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.top_products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No sales yet.</TableCell>
                  </TableRow>
                )}
                {report.top_products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell align="right">{p.units_sold}</TableCell>
                    <TableCell align="right">{formatMoney(p.revenue)}</TableCell>
                    <TableCell align="right">{formatMoney(p.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Needs restocking</Typography>
            <Chip
              size="small"
              label={report.low_stock.length}
              color={report.low_stock.length ? "warning" : "success"}
            />
          </Box>
          {report.low_stock.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 1 }}>Nothing is running low.</Typography>
          ) : (
            <List dense>
              {report.low_stock.map((p) => (
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
      </Box>
    </>
  );
}

function AttendantDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!products) return <Loading />;

  const lowStock = products.filter((p) => p.is_low_stock);

  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>Welcome, {user.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Use New sale to record a sale. Items running low are listed below.
      </Typography>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6">Running low</Typography>
        {lowStock.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>Nothing is running low.</Typography>
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

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === "admin" ? <AdminDashboard /> : <AttendantDashboard />;
}