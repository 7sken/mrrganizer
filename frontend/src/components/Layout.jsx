// Układ strony: górny pasek z nawigacją (desktop) i dolna nawigacja (telefon).
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Tabs, Tab, Typography, IconButton, Tooltip,
  BottomNavigation, BottomNavigationAction, Paper, Container,
} from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import KitchenRoundedIcon from '@mui/icons-material/KitchenRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useAuth } from '../lib/auth.jsx';
import { APP_NAME } from '../lib/config.js';
import CatFace from './CatFace.jsx';
import { groovy } from '../theme.js';

export const NAV = [
  { path: '/', label: 'Pulpit', icon: <HomeRoundedIcon /> },
  { path: '/koty', label: 'Koty', icon: <PetsRoundedIcon /> },
  { path: '/spizarnia', label: 'Spiżarnia', icon: <KitchenRoundedIcon /> },
  { path: '/planer', label: 'Planer', icon: <CalendarMonthRoundedIcon /> },
  { path: '/zadania', label: 'Zadania', icon: <ChecklistRoundedIcon /> },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const current = NAV.find((n) => n.path === location.pathname)?.path ?? '/';

  return (
    <Box sx={{ minHeight: '100vh', pb: { xs: 10, md: 4 } }}>
      <AppBar position="sticky" elevation={0} color="inherit"
        sx={{ bgcolor: 'rgba(255,248,241,0.9)', backdropFilter: 'blur(8px)', borderBottom: '2px solid #f6e3d6' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <CatFace size={40} interactive={false} />
            <Typography sx={{ ...groovy(2), fontSize: '1.9rem', WebkitTextStroke: '1px #7a3b12' }}>
              {APP_NAME}
            </Typography>
          </Box>

          <Tabs value={current} onChange={(_, v) => navigate(v)} sx={{ ml: 3, flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
            slotProps={{ indicator: { sx: { height: 4, borderRadius: '16px' } } }}>
            {NAV.map((n) => (
              <Tab key={n.path} value={n.path} label={n.label} icon={n.icon} iconPosition="start"
                sx={{ minHeight: 64, fontWeight: 800 }} />
            ))}
          </Tabs>
          <Box sx={{ flexGrow: 1, display: { xs: 'block', md: 'none' } }} />

          <Typography sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 700, color: 'text.secondary' }}>
            Cześć, {user.name}!
          </Typography>
          <Tooltip title="Wyloguj">
            <IconButton onClick={logout} aria-label="Wyloguj">
              <LogoutRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {children}
      </Container>

      <Paper elevation={8} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: { xs: 'block', md: 'none' }, zIndex: 10, borderRadius: '20px 20px 0 0' }}>
        <BottomNavigation value={current} onChange={(_, v) => navigate(v)} showLabels sx={{ borderRadius: '20px 20px 0 0' }}>
          {NAV.map((n) => (
            <BottomNavigationAction key={n.path} value={n.path} label={n.label} icon={n.icon} sx={{ minWidth: 0 }} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
