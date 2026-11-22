import { NavLink, Outlet } from "react-router-dom";
import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../auth/useAuth";

const navSx = {
  color: "inherit",
  "&.active": { bgcolor: "rgba(255,255,255,0.2)" },
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, flexWrap: "wrap" }}>
          <Typography variant="h6" sx={{ mr: 2, fontWeight: 700 }}>
            MerqonTrades
          </Typography>
          <Button component={NavLink} to="/" end sx={navSx}>
            Dashboard
          </Button>
          <Button component={NavLink} to="/products" sx={navSx}>
            Products
          </Button>
          <Button component={NavLink} to="/categories" sx={navSx}>
            Categories
          </Button>
          {user.role === "admin" && (
            <Button component={NavLink} to="/stock" sx={navSx}>
              Stock
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            label={`${user.name} (${user.role})`}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "inherit" }}
          />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}