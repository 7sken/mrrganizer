// Pulpit: kot z humorem zależnym od stanu spiżarni, dzisiejsze posiłki, alerty i zadania.
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Checkbox, List, ListItem, ListItemIcon,
  ListItemText, Button, Stack, LinearProgress, Alert,
} from '@mui/material';
import CatFace from '../components/CatFace.jsx';
import { SectionCard } from '../components/common.jsx';
import { useData } from '../lib/useData.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useNotify } from '../lib/notify.jsx';
import { todayIso, relativeDays, TASK_CATEGORIES, formatDate, formatRating } from '../lib/utils.js';

export const MOOD_TEXT = {
  happy: { title: 'Miska pełna, życie piękne!', text: 'Spiżarnia w porządku, nic się nie przeterminowuje. Mrrr.' },
  meh: { title: 'Hmm… coś się kończy 👀', text: 'Kilka rzeczy wymaga uwagi – zerknij na alerty poniżej.' },
  sad: { title: 'MIAU! Alarm w spiżarni!', text: 'Coś się przeterminowało albo karma się skończyła. Ratuj!' },
};

function StatTile({ label, value, emoji, onClick }) {
  return (
    <Card onClick={onClick} sx={{ cursor: 'pointer', transition: 'transform .15s', '&:hover': { transform: 'translateY(-3px)' } }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Typography sx={{ fontSize: 28 }}>{emoji}</Typography>
        <Typography variant="h4">{value}</Typography>
        <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: 14 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useNotify();
  const today = todayIso();
  const { data, loading, error, reload } = useData(`/dashboard?today=${today}`);
  const { data: cats } = useData('/cats', []);

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const mood = MOOD_TEXT[data.mood];
  const catById = Object.fromEntries((cats || []).map((c) => [c.id, c]));

  const serve = async (meal) => {
    await api.patch(`/meals/${meal.id}/serve`);
    notify(meal.served ? 'Cofnięto' : `${meal.cat_name} nakarmiony! 😻`);
    reload();
  };

  return (
    <Stack spacing={3}>
      {/* Hero z kotami */}
      <Card sx={{ background: 'linear-gradient(135deg, #ffe7d9 0%, #f3e9ff 100%)', borderColor: '#f3d9c9' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 4 }, flexDirection: { xs: 'column', sm: 'row' }, py: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {cats?.length ? (
              cats.slice(0, 3).map((c) => (
                <Box key={c.id} sx={{ textAlign: 'center' }}>
                  <CatFace avatar={c.avatar} mood={data.mood} size={cats.length > 1 ? 130 : 170} name={c.name} />
                  <Typography sx={{ fontWeight: 800 }}>{c.name}</Typography>
                </Box>
              ))
            ) : (
              <CatFace mood={data.mood} size={170} />
            )}
          </Box>
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>Cześć, {user.name}! Dziś {formatDate(today)}</Typography>
            <Typography variant="h4" sx={{ my: 0.5 }}>{mood.title}</Typography>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>{mood.text}</Typography>
            <Typography variant="caption" color="text.secondary">Psst… kliknij kota, żeby go pogłaskać.</Typography>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        <StatTile label="Koty" value={data.counts.cats} emoji="🐱" onClick={() => navigate('/koty')} />
        <StatTile label="Rodzaje karm" value={data.counts.foodKinds} emoji="🥫" onClick={() => navigate('/spizarnia')} />
        <StatTile label="Sztuk w spiżarni" value={data.counts.units} emoji="📦" onClick={() => navigate('/spizarnia')} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <SectionCard title="Dzisiejsze menu" emoji="🍽️"
          action={<Button size="small" onClick={() => navigate('/planer')}>Planer</Button>}>
          {data.todayMeals.length === 0 ? (
            <Typography color="text.secondary">
              Brak planu na dziś. Wejdź w Planer i kliknij „Losuj menu”.
            </Typography>
          ) : (
            <List dense disablePadding>
              {data.todayMeals.map((m) => (
                <ListItem key={m.id} disableGutters secondaryAction={
                  <Checkbox edge="end" checked={!!m.served} onChange={() => serve(m)}
                    slotProps={{ input: { 'aria-label': `Podane: ${m.cat_name} ${m.slot}` } }} />
                }>
                  <ListItemIcon sx={{ minWidth: 52 }}>
                    <CatFace avatar={catById[m.cat_id]?.avatar} size={40} interactive={false} mood={m.served ? 'happy' : 'meh'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${m.cat_name} · ${m.slot === 'rano' ? '☀️ rano' : '🌙 wieczór'}`}
                    secondary={`${m.brand} – ${m.flavor}`}
                    sx={{ textDecoration: m.served ? 'line-through' : 'none', opacity: m.served ? 0.6 : 1 }}
                    slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </SectionCard>

        <SectionCard title="Alerty spiżarni" emoji="🚨"
          action={<Button size="small" onClick={() => navigate('/zadania')}>Lista zakupów</Button>}>
          {data.lowStock.length === 0 && data.expiring.length === 0 ? (
            <Typography color="text.secondary">Wszystko gra. Nic się nie kończy 🎉</Typography>
          ) : (
            <Stack spacing={1}>
              {data.lowStock.map((f) => (
                <Alert key={`l${f.id}`} severity={f.quantity === 0 ? 'error' : 'warning'} sx={{ py: 0 }}>
                  <b>{f.brand} {f.flavor}</b> – {f.quantity === 0 ? 'skończyła się!' : `zostało ${f.quantity} szt.`}
                </Alert>
              ))}
              {data.expiring.map((f) => (
                <Alert key={`e${f.id}`} severity={f.expiry_date < today ? 'error' : 'info'} sx={{ py: 0 }}>
                  <b>{f.brand} {f.flavor}</b> – termin {f.expiry_date < today ? 'minął' : 'mija'} {relativeDays(f.expiry_date, today)}
                </Alert>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard title="Najbliższe zadania" emoji="📌"
          action={<Button size="small" onClick={() => navigate('/zadania')}>Wszystkie</Button>}>
          {data.tasks.length === 0 ? (
            <Typography color="text.secondary">Na najbliższe dni nic nie zaplanowano.</Typography>
          ) : (
            <Stack spacing={1}>
              {data.tasks.map((t) => (
                <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{TASK_CATEGORIES[t.category]?.emoji}</span>
                  <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>{t.title}</Typography>
                  <Chip size="small" label={relativeDays(t.due_date, today)}
                    color={t.due_date < today ? 'error' : t.due_date === today ? 'warning' : 'default'} />
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>

        <SectionCard title="Hit sezonu" emoji="🏆">
          {data.favourite ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: 48 }}>😻</Typography>
              <Box>
                <Typography variant="h6">{data.favourite.brand}</Typography>
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>{data.favourite.flavor}</Typography>
                <Typography variant="caption">
                  średnia ocena {formatRating(data.favourite.avg)} / 3 · głosów: {data.favourite.votes}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">Oceń karmy w Spiżarni, a tu pojawi się ulubieniec.</Typography>
          )}
        </SectionCard>
      </Box>
    </Stack>
  );
}
