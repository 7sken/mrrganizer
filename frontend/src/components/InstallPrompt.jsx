// Baner "Dodaj na ekran telefonu" (PWA).
//  - iPhone/iPad (Safari): instrukcja "Udostępnij → Do ekranu początkowego" (iOS nie ma przycisku instalacji),
//  - Android/Chrome/Edge: przycisk "Zainstaluj" (zdarzenie beforeinstallprompt).
// Nie pokazuje się, gdy aplikacja jest już zainstalowana albo baner został zamknięty.
import { useEffect, useState } from 'react';
import { Paper, Box, Typography, Button, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import CatFace from './CatFace.jsx';

const DISMISS_KEY = 'mrrganizer_install_dismissed';

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isIos(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints) {
  // iPadOS udaje Maca, więc sprawdzamy też ekran dotykowy
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && touchPoints > 1);
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null); // zdarzenie instalacji z Chrome
  const [mode, setMode] = useState(null); // 'ios' | 'android' | null

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return undefined;
    if (isIos()) {
      setMode('ios');
      return undefined;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setMode('android');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const close = () => {
    setMode(null);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* tryb prywatny – trudno */
    }
  };

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setMode(null);
  };

  if (!mode) return null;

  return (
    <Paper elevation={6} role="dialog" aria-label="Dodaj aplikację na ekran telefonu"
      sx={{
        position: 'fixed', left: 12, right: 12, zIndex: 1300, maxWidth: 480, mx: 'auto',
        bottom: { xs: 'calc(72px + env(safe-area-inset-bottom))', md: 16 },
        borderRadius: '20px', p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
        border: '2px solid #f6e3d6', bgcolor: '#fffaf5',
      }}>
      <CatFace size={52} interactive={false} />
      <Box sx={{ flexGrow: 1 }}>
        <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Mrrganizer na telefonie 📱</Typography>
        {mode === 'ios' ? (
          <Typography variant="body2" color="text.secondary">
            Stuknij <IosShareRoundedIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} /> <b>Udostępnij</b>, a potem{' '}
            <b>„Do ekranu początkowego”</b>.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">Zainstaluj jak zwykłą aplikację – bez sklepu.</Typography>
        )}
      </Box>
      {mode === 'android' && <Button variant="contained" size="small" onClick={install}>Zainstaluj</Button>}
      <IconButton size="small" onClick={close} aria-label="Zamknij"><CloseRoundedIcon fontSize="small" /></IconButton>
    </Paper>
  );
}
