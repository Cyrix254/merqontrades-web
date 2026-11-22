import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, MenuItem, Paper, Snackbar, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../api";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../utils";

function UserDialog({ user, isSelf, onClose, onSaved }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "attendant",
    is_active: user?.is_active ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const valid =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    (isEdit ? form.password === "" || form.password.length >= 8 : form.password.length >= 8);

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/users/${user.id}`, {
          name: form.name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
          password: form.password || null,
        });
      } else {
        await api.post("/users", {
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
        });
      }
      onSaved(isEdit ? "User updated." : "User added.");
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Edit user" : "Add user"}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        <TextField label="Full name" fullWidth margin="dense" value={form.name} onChange={change("name")} />
        <TextField label="Email" type="email" fullWidth margin="dense" value={form.email} onChange={change("email")} />
        <TextField
          label={isEdit ? "New password (leave blank to keep the current one)" : "Password"}
          type="password"
          fullWidth
          margin="dense"
          value={form.password}
          onChange={change("password")}
          helperText="At least 8 characters"
          autoComplete="new-password"
        />
        <TextField
          select
          label="Role"
          fullWidth
          margin="dense"
          value={form.role}
          onChange={change("role")}
          disabled={isSelf}
          helperText={isSelf ? "You cannot change your own role." : " "}
        >
          <MenuItem value="attendant">Sales attendant</MenuItem>
          <MenuItem value="admin">Owner (admin)</MenuItem>
        </TextField>

        {isEdit && (
          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                disabled={isSelf}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
            }
            label={form.is_active ? "Account active" : "Account deactivated"}
          />
        )}
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

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null); // null = closed, {} = new, user = edit
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
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

  const hasHistory = (u) => u.sales_count > 0 || u.stock_movements_count > 0;

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setMessage("User deleted.");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Users</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({})}>
          Add user
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Accounts that have recorded sales or stock changes cannot be deleted, so your records stay
        accurate. Deactivate them instead. Only accounts with no history show a delete button.
      </Alert>

      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.6 }}>
                  <TableCell>
                    {u.name}
                    {u.id === me.id && <Chip size="small" label="You" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={u.role === "admin" ? "primary" : "default"}
                      label={u.role === "admin" ? "Owner" : "Attendant"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={u.is_active ? "success" : "default"}
                      variant={u.is_active ? "outlined" : "filled"}
                      label={u.is_active ? "Active" : "Deactivated"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => setDialog(u)}><EditIcon /></IconButton>
                    {u.id !== me.id && !hasHistory(u) && (
                      <Tooltip title="Delete (no records attached)">
                        <IconButton color="error" onClick={() => handleDelete(u)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {dialog && (
        <UserDialog
          key={dialog.id ?? "new"}
          user={dialog.id ? dialog : null}
          isSelf={dialog.id === me.id}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage("")} message={message} />
    </>
  );
}