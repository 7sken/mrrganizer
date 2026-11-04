// Planer karmienia: tydzień × koty × (rano, wieczór). "Losuj menu" układa plan sam.
import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton, Menu, MenuItem, ListItemIcon,
  ListItemText, Checkbox, LinearProgress, Tooltip, Divider,
} from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CatFace from '../components/CatFace.jsx';
import FoodIcon from '../components/FoodIcon.jsx';
import { PageHeader, EmptyState } from '../components/common.jsx';
import { useData } from '../lib/useData.js';
import { api } from '../lib/api.js';
import { useNotify } from '../lib/notify.jsx';
import { todayIso, startOfWeek, addDays, formatDay, formatDate } from '../lib/utils.js';

const SLOTS = [
  { value: 'rano', label: '☀️ rano' },
  { value: 'wieczor', label: '🌙 wieczór' },
];

function MealCell({ meal, onPick, onServe, isToday }) {
  if (!meal) {
    return (
      <Box component="button" type="button" onClick={onPick} aria-label="Dodaj posiłek"
        sx={{
          width: '100%', height: 74, border: '2px dashed #f0d5c5', borderRadius: '12px', bgcolor: 'transparent',
          color: 'text.secondary', cursor: 'pointer', display: 'grid', placeItems: 'center',
          '&:hover': { bgcolor: '#fff1e6' },
        }}>
        <AddRoundedIcon fontSize="small" />
      </Box>
    );
  }
  return (
    <Box sx={{
      position: 'relative', height: 74, borderRadius: '12px', p: 0.75, display: 'flex', alignItems: 'center', gap: 0.5,
      bgcolor: meal.served ? '#e8f5e9' : isToday ? '#fff1e6' : '#fdf6f0',
      border: '2px solid', borderColor: meal.served ? '#a5d6a7' : '#f6e3d6',
    }}>
      <Box onClick={onPick} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', minWidth: 0, flexGrow: 1 }}>
        <FoodIcon type={meal.type} brand={meal.brand} size={30} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1.1 }} noWrap>{meal.brand}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {meal.flavor}
          </Typography>
        </Box>
      </Box>
      <Tooltip title={meal.served ? 'Podane ✔ (kliknij, aby cofnąć)' : 'Oznacz jako podane'}>
        <Checkbox size="small" checked={!!meal.served} onChange={onServe} sx={{ p: 0.25 }} color="success"
          slotProps={{ input: { 'aria-label': 'Podane' } }} />
      </Tooltip>
    </Box>
  );
}

export default function PlannerPage() {
  const today = todayIso();
  const [weekStart, setWeekStart] = useState(startOfWeek(today));
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: meals, loading, reload } = useData(`/meals?start=${weekStart}&end=${weekEnd}`, []);
  const { data: cats, loading: catsLoading } = useData('/cats', []);
  const { data: foods, reload: reloadFoods } = useData('/foods', []);
  const [menu, setMenu] = useState(null); // { anchor, cat, date, slot }
  const [busy, setBusy] = useState(false);
  const notify = useNotify();

  const mealFor = (catId, date, slot) => meals.find((m) => m.cat_id === catId && m.date === date && m.slot === slot);

  const generate = async () => {
    setBusy(true);
    try {
      // Nie planujemy wstecz – zaczynamy od dziś, jeśli to bieżący tydzień
      const start = weekStart < today && weekEnd >= today ? today : weekStart;
      const days = Math.max(1, 7 - Math.round((new Date(start) - new Date(weekStart)) / 86400000));
      const { created } = await api.post('/meals/generate', { start, days });
      notify(created ? `Wylosowano ${created} posiłków 🎲` : 'Brak karm na stanie do losowania', created ? 'success' : 'warning');
      reload();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const pickFood = async (food) => {
    const { cat, date, slot } = menu;
    setMenu(null);
    await api.post('/meals', { cat_id: cat.id, food_id: food.id, date, slot });
    reload();
  };

  const removeMeal = async () => {
    const meal = mealFor(menu.cat.id, menu.date, menu.slot);
    setMenu(null);
    if (meal) await api.del(`/meals/${meal.id}`);
    reload();
  };

  const serve = async (meal) => {
    await api.patch(`/meals/${meal.id}/serve`);
    if (!meal.served) notify(`${meal.cat_name} wcina ${meal.flavor} 😋`);
    reload();
    reloadFoods();
  };

  if (loading || catsLoading) return <LinearProgress />;

  return (
    <>
      <PageHeader title="Planer karmienia" subtitle={`Tydzień ${formatDate(weekStart)} – ${formatDate(weekEnd)}`}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Poprzedni tydzień"><ChevronLeftRoundedIcon /></IconButton>
            <Button onClick={() => setWeekStart(startOfWeek(today))}>Dziś</Button>
            <IconButton onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Następny tydzień"><ChevronRightRoundedIcon /></IconButton>
            <Button variant="contained" startIcon={<CasinoRoundedIcon />} onClick={generate} disabled={busy || !cats.length}>
              Losuj menu
            </Button>
          </Box>
        } />

      {cats.length === 0 ? (
        <EmptyState text="Najpierw dodaj kota w zakładce Koty – planer musi wiedzieć, kogo karmić." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            🎲 „Losuj menu” bierze mokre karmy ze spiżarni: ulubione częściej, 🙀 nigdy, bez powtórek pod rząd i nie więcej niż masz sztuk.
            Zaznaczenie „podane” zdejmuje puszkę ze stanu.
          </Typography>
          {cats.map((cat) => (
            <Card key={cat.id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <CatFace avatar={cat.avatar} size={56} name={cat.name} />
                  <Typography variant="h5">{cat.name}</Typography>
                </Box>
                <Box sx={{ overflowX: 'auto', pb: 1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '70px repeat(7, minmax(120px, 1fr))', gap: 1, minWidth: 920 }}>
                    <Box />
                    {days.map((d) => (
                      <Typography key={d} sx={{
                        textAlign: 'center', fontWeight: 800, fontSize: 14, borderRadius: '8px', py: 0.5,
                        bgcolor: d === today ? 'primary.main' : 'transparent', color: d === today ? '#fff' : 'text.primary',
                      }}>
                        {formatDay(d)}
                      </Typography>
                    ))}
                    {SLOTS.map((slot) => (
                      <Box key={slot.value} sx={{ display: 'contents' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, alignSelf: 'center', color: 'text.secondary' }}>{slot.label}</Typography>
                        {days.map((d) => {
                          const meal = mealFor(cat.id, d, slot.value);
                          return (
                            <MealCell key={d} meal={meal} isToday={d === today}
                              onPick={(e) => setMenu({ anchor: e.currentTarget, cat, date: d, slot: slot.value })}
                              onServe={() => serve(meal)} />
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu && (
          <MenuItem disabled sx={{ opacity: '1 !important', fontWeight: 800 }}>
            {menu.cat.name} · {formatDay(menu.date)} · {menu.slot === 'rano' ? 'rano' : 'wieczór'}
          </MenuItem>
        )}
        <Divider />
        {foods.filter((f) => f.type !== 'przysmak').map((f) => (
          <MenuItem key={f.id} onClick={() => pickFood(f)} disabled={f.quantity === 0 && f.type === 'mokra'}>
            <ListItemIcon><FoodIcon type={f.type} brand={f.brand} size={28} /></ListItemIcon>
            <ListItemText primary={`${f.brand} – ${f.flavor}`} secondary={`na stanie: ${f.quantity} szt.`} />
            {menu && f.ratings?.[menu.cat.id] && (
              <Typography sx={{ ml: 1 }}>{['', '🙀', '😼', '😻'][f.ratings[menu.cat.id]]}</Typography>
            )}
          </MenuItem>
        ))}
        {menu && mealFor(menu.cat.id, menu.date, menu.slot) && [
          <Divider key="d" />,
          <MenuItem key="rm" onClick={removeMeal} sx={{ color: 'error.main' }}>Usuń z planu</MenuItem>,
        ]}
      </Menu>
    </>
  );
}
