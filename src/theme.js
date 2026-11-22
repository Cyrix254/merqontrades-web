import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#2f5496" },
    background: { default: "#f4f6fa" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Roboto, "Segoe UI", Arial, sans-serif',
  },
});

export default theme;