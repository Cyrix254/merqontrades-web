import {
  Box, Button, Dialog, DialogActions, DialogContent, Divider, GlobalStyles,
  Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { formatMoney } from "../utils";

// When printing, show only the receipt
const printStyles = (
  <GlobalStyles
    styles={{
      "@media print": {
        "body *": { visibility: "hidden" },
        "#receipt, #receipt *": { visibility: "visible" },
        "#receipt": { position: "absolute", left: 0, top: 0, width: "100%" },
      },
    }}
  />
);

export default function ReceiptDialog({ sale, onClose }) {
  const receiptNo = `#${String(sale.id).padStart(5, "0")}`;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      {printStyles}
      <DialogContent>
        <Box id="receipt" sx={{ p: 1 }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 700 }}>
            MerqonTrades
          </Typography>
          <Typography align="center" color="text.secondary" variant="body2">
            Receipt {receiptNo}
          </Typography>
          <Typography align="center" color="text.secondary" variant="body2" sx={{ mb: 1 }}>
            {new Date(sale.created_at).toLocaleString()}
            {sale.user ? ` · Served by ${sale.user.name}` : ""}
          </Typography>
          <Divider />

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.product?.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatMoney(item.selling_price)}</TableCell>
                  <TableCell align="right">{formatMoney(item.selling_price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 700 }}>TOTAL</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatMoney(sale.total_amount)}</Typography>
          </Box>
          <Typography align="center" color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            Thank you for your business!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<PrintIcon />} onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}