// Ekran logowania / rejestracji. Kot zasłania oczy łapkami, gdy wpisujesz hasło 🙈
import { useState } from 'react';
import { Box, Card, CardContent, Tabs, Tab, TextField, Button, Typography, Alert, Stack, Link } from '@mui/material';
import { useAuth } from '../lib/auth.jsx';
import { APP_NAME, APP_TAGLINE } from '../lib/config.js';
import CatFace from '../components/CatFace.jsx';

export function validateAuth(mode, form) {
  const errors = {};
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Podaj poprawny e-mail';
  if (mode === 'register') {
    if (form.name.trim().length < 2) errors.name = 'Imię musi mieć min. 2 znaki';
    if (form.password.length < 8) errors.password = 'Hasło musi mieć min. 8 znaków';
  } else if (!form.password) {
    errors.password = 'Podaj hasło';
  }
  return errors;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validateAuth(mode, form);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const mood = serverError ? 'sad' : 'happy';

  return (
    <Box sx={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2,
      background: 'radial-gradient(circle at 20% 20%, #ffe0d1 0, transparent 40%), radial-gradient(circle at 80% 80%, #e8dcff 0, transparent 45%), #fff8f1',
    }}>
      <Card sx={{ width: '100%', maxWidth: 880, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, overflow: 'visible' }}>
        <Box sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4,
          bgcolor: '#fff1e6', borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' },
        }}>
          <CatFace size={210} mood={mood} coverEyes={passwordFocus} />
          <Typography variant="h4" sx={{ fontSize: '3.4rem' }}>{APP_NAME}</Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'center', fontWeight: 700 }}>
            {APP_TAGLINE} – żeby w misce nigdy nie zabrakło ulubionego smaku 🐟
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Tabs value={mode} onChange={(_, v) => { setMode(v); setErrors({}); setServerError(''); }} sx={{ mb: 3 }} variant="fullWidth">
            <Tab value="login" label="Logowanie" />
            <Tab value="register" label="Rejestracja" />
          </Tabs>

          <Stack component="form" onSubmit={submit} spacing={2} noValidate>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {mode === 'register' && (
              <TextField label="Imię" value={form.name} onChange={set('name')} error={!!errors.name} helperText={errors.name} />
            )}
            <TextField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={set('email')}
              error={!!errors.email} helperText={errors.email} />
            <TextField label="Hasło" type="password" value={form.password} onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onFocus={() => setPasswordFocus(true)} onBlur={() => setPasswordFocus(false)}
              error={!!errors.password} helperText={errors.password || (mode === 'register' ? 'Min. 8 znaków' : ' ')} />
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
            </Button>
            {mode === 'login' && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Konto demo:{' '}
                <Link component="button" type="button" onClick={() => setForm({ ...form, email: 'demo@mrrganizer.pl', password: 'demo1234' })}>
                  demo@mrrganizer.pl / demo1234
                </Link>
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
