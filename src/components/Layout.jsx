import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  AppBar, Box, Button, Chip, Container, Divider, Drawer, IconButton, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import PeopleIcon from "@mui/icons-material/People";
import { useAuth } from "../auth/useAuth";

const navSx = {
  color: "inherit",
  whiteSpace: "nowrap",
  "&.active": { bgcolor: "rgba(255,255,255,0.2)" },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = user.role === "admin";

  // One list drives both the desktop buttons and the phone menu
  const links = [
    { to: "/", label: "Dashboard", icon: <DashboardIcon />, end: true },
    { to: "/sales/new", label: "New sale", icon: <PointOfSaleIcon /> },
    { to: "/sales", label: "Sales", icon: <ReceiptLongIcon />, end: true },
    { to: "/products", label: "Products", icon: <Inventory2Icon /> },
    { to: "/categories", label: "Categories", icon: <CategoryIcon /> },
    ...(isAdmin
      ? [
          { to: "/stock", label: "Stock", icon: <WarehouseIcon /> },
          { to: "/users", label: "Users", icon: <PeopleIcon /> },
        ]
      : []),
  ];

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = () => {
    closeDrawer();
    logout();
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 0.5 }}>
          {isMobile && (
            <IconButton color="inherit" edge="start" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ mr: 2, fontWeight: 700 }}>
            MerqonTrades
          </Typography>

          {!isMobile && (
            <>
              {links.map((l) => (
                <Button key={l.to} component={NavLink} to={l.to} end={l.end} startIcon={l.icon} sx={navSx}>
                  {l.label}
                </Button>
              ))}
              <Box sx={{ flexGrow: 1 }} />
              <Chip
                label={`${user.name} (${user.role})`}
                size="small"
                sx={{
                  display: { xs: "none", xl: "inline-flex" },
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "inherit",
                  mr: 1,
                }}
              />
              <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout} sx={{ whiteSpace: "nowrap" }}>
                Log out
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Slide-out menu used on phones and small screens */}
      <Drawer anchor="left" open={isMobile && drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: 270 }} role="navigation">
          <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              MerqonTrades
            </Typography>
            <Typography variant="body2">{user.name}</Typography>
            <Typography variant="caption">
              {isAdmin ? "Owner" : "Sales attendant"}
            </Typography>
          </Box>

          <List>
            {links.map((l) => (
              <ListItemButton
                key={l.to}
                component={NavLink}
                to={l.to}
                end={l.end}
                onClick={closeDrawer}
                sx={{ "&.active": { bgcolor: "action.selected", fontWeight: 700 } }}
              >
                <ListItemIcon>{l.icon}</ListItemIcon>
                <ListItemText primary={l.label} />
              </ListItemButton>
            ))}
          </List>

          <Divider />
          <List>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Log out" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
        <Outlet />
      </Container>
    </>
  );
}