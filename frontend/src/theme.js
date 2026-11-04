// Motyw Material UI – pastelowe kolory, zaokrąglone rogi, czcionka Nunito.
import { createTheme } from '@mui/material/styles';

// Kreskówkowy styl nagłówków: gruba czcionka Modak, brązowy obrys i cień "3D"
export const DISPLAY_FONT = '"Modak", "Nunito", cursive';
export const groovy = (shadow = 3) => ({
  fontFamily: DISPLAY_FONT,
  fontWeight: 400,
  letterSpacing: 0.5,
  lineHeight: 1.05,
  color: '#ff8a65',
  WebkitTextStroke: '1.5px #7a3b12',
  textShadow: `${shadow}px ${shadow}px 0 #7a3b12`,
});

export const theme = createTheme({
  palette: {
    primary: { main: '#ff8a65', light: '#ffbb93', dark: '#e0603d', contrastText: '#fff' },
    secondary: { main: '#9575cd', light: '#c7a4ff', dark: '#65499c' },
    success: { main: '#66bb6a' },
    warning: { main: '#ffa726' },
    error: { main: '#ef5350' },
    background: { default: '#fff8f1', paper: '#ffffff' },
    text: { primary: '#4a3b38', secondary: '#8a7470' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", sans-serif',
    h4: { ...groovy(3), fontSize: '2.6rem' },
    h5: { fontFamily: DISPLAY_FONT, fontWeight: 400, fontSize: '1.9rem', lineHeight: 1.1, color: '#7a3b12', letterSpacing: 0.5 },
    h6: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: 'none' },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '2px solid #f6e3d6', boxShadow: '0 6px 0 #f6e3d6' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999, paddingInline: 18 } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24 } } },
    MuiTextField: { defaultProps: { fullWidth: true, size: 'small' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});
