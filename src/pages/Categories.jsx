import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../utils";

function CategoryDialog({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      if (isEdit) await api.put(`/categories/${category.id}`, { name });
      else await api.post("/categories", { name });
      onSaved(isEdit ? "Category updated." : "Category added.");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TextField
          autoFocus
          label="Category name"
          fullWidth
          margin="dense"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || !name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null); // null = closed, {} = new, category = edit
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = (text) => {
    setDialog(null);
    setMessage(text);
    load();
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? Its products will be kept without a category.`)) return;
    try {
      await api.delete(`/categories/${category.id}`);
      setMessage("Category deleted.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Categories</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({})}>
            Add category
          </Button>
        )}
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
                <TableCell align="right">Products</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No categories yet.</TableCell>
                </TableRow>
              )}
              {categories.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.name}</TableCell>
                  <TableCell align="right">{c.products_count}</TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton onClick={() => setDialog(c)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(c)}><DeleteIcon /></IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialog && (
        <CategoryDialog
          key={dialog.id ?? "new"}
          category={dialog.id ? dialog : null}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </>
  );
}