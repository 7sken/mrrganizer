// Spiżarnia: karmy, stan (+/-), daty ważności i oceny kotów 🙀 😼 😻
import { useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton, Chip, Stack, LinearProgress,
  TextField, Tabs, Tab, Tooltip, InputAdornment, FormControlLabel, Switch,
} from '@mui/material';
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FoodIcon from '../components/FoodIcon.jsx';
import FoodDialog from '../components/FoodDialog.jsx';
import CatFace from '../components/CatFace.jsx';
import { PageHeader, EmptyState } from '../components/common.jsx';
import { useData } from '../lib/useData.js';
import { api } from '../lib/api.js';
import { useNotify } from '../lib/notify.jsx';
import { foodStatus, formatDate, relativeDays, RATINGS, FOOD_TYPES } from '../lib/utils.js';

const STATUS = {
  expired: { label: 'Po terminie!', color: 'error' },
  empty: { label: 'Skończyła się', color: 'error' },
  low: { label: 'Kończy się', color: 'warning' },
  expiring: { label: 'Termin się zbliża', color: 'info' },
  ok: { label: 'W porządku', color: 'success' },
  inactive: { label: 'Nieużywana – alerty wyciszone', color: 'default' },
};

function RatingRow({ cat, value, onRate }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CatFace avatar={cat.avatar} size={30} interactive={false} />
      <Typography sx={{ fontWeight: 700, fontSize: 14, flexGrow: 1 }}>{cat.name}</Typography>
      {RATINGS.map((r) => (
        <Tooltip key={r.value} title={r.label}>
          <Box component="button" type="button" onClick={() => onRate(r.value)} aria-label={`${cat.name}: ${r.label}`}
            aria-pressed={value === r.value}
            sx={{
              fontSize: 22, lineHeight: 1, p: 0.4, border: 'none', borderRadius: '8px', cursor: 'pointer',
              bgcolor: value === r.value ? '#ffe0d1' : 'transparent',
              filter: value === r.value ? 'none' : 'grayscale(1)', opacity: value === r.value ? 1 : 0.45,
              transform: value === r.value ? 'scale(1.15)' : 'none', transition: 'all .15s',
              '&:hover': { filter: 'none', opacity: 1 },
            }}>
            {r.emoji}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}

export default function PantryPage() {
  const { data: foods, setData: setFoods, loading, reload } = useData('/foods', []);
  const { data: cats } = useData('/cats', []);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');
  const [hideInactive, setHideInactive] = useState(false);
  const [dialog, setDialog] = useState({ open: false, food: null });
  const notify = useNotify();

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return foods.filter(
      (f) => (type === 'all' || f.type === type) &&
        (!hideInactive || f.active) &&
        (!query || `${f.brand} ${f.flavor}`.toLowerCase().includes(query))
    );
  }, [foods, type, q, hideInactive]);

  const inactiveCount = foods.filter((f) => !f.active).length;

  const replace = (updated) => setFoods((list) => list.map((f) => (f.id === updated.id ? updated : f)));

  const changeQty = async (food, change) => replace(await api.patch(`/foods/${food.id}/quantity`, { change }));

  const toggleActive = async (food) => {
    replace(await api.patch(`/foods/${food.id}/active`, { active: !food.active }));
    notify(food.active ? `${food.brand} ${food.flavor}: wyciszone 🔕` : `${food.brand} ${food.flavor}: znowu na liście 🔔`, 'info');
  };

  const rate = async (food, cat, rating) => {
    replace(await api.put(`/foods/${food.id}/rating`, { cat_id: cat.id, rating }));
    notify(`${cat.name}: ${RATINGS.find((r) => r.value === rating).emoji} zapisane`);
  };

  const save = async (body) => {
    if (dialog.food) await api.put(`/foods/${dialog.food.id}`, body);
    else await api.post('/foods', body);
    notify(dialog.food ? 'Zapisano zmiany' : 'Dodano do spiżarni 🥫');
    setDialog({ open: false, food: null });
    reload();
  };

  const remove = async (food) => {
    if (!window.confirm(`Usunąć ${food.brand} ${food.flavor}?`)) return;
    await api.del(`/foods/${food.id}`);
    notify('Usunięto', 'info');
    reload();
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      <PageHeader title="Spiżarnia" subtitle="Co masz, ile zostało i co koty o tym myślą."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ open: true, food: null })}>Dodaj karmę</Button>} />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
        <Tabs value={type} onChange={(_, v) => setType(v)} variant="scrollable">
          <Tab value="all" label="Wszystko" />
          {Object.entries(FOOD_TYPES).map(([v, l]) => <Tab key={v} value={v} label={l} />)}
        </Tabs>
        {inactiveCount > 0 && (
          <FormControlLabel sx={{ ml: { sm: 'auto' }, whiteSpace: 'nowrap' }}
            control={<Switch checked={hideInactive} onChange={(e) => setHideInactive(e.target.checked)} />}
            label={`Ukryj nieużywane (${inactiveCount})`} />
        )}
        <TextField placeholder="Szukaj marki lub smaku…" value={q} onChange={(e) => setQ(e.target.value)} sx={{ maxWidth: { sm: 320 }, ml: { sm: inactiveCount > 0 ? 0 : 'auto' } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />
      </Box>

      {foods.length === 0 ? (
        <EmptyState text="Spiżarnia świeci pustkami… Kot patrzy z wyrzutem." mood="sad" actionLabel="Dodaj pierwszą karmę"
          onAction={() => setDialog({ open: true, food: null })} />
      ) : visible.length === 0 ? (
        <Typography color="text.secondary">Nic nie pasuje do filtrów.</Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {visible.map((food) => {
            const status = STATUS[foodStatus(food)];
            const fill = Math.min(100, (food.quantity / Math.max(1, food.min_quantity * 3)) * 100);
            return (
              <Card key={food.id} data-testid="food-card"
                sx={!food.active ? { opacity: 0.6, bgcolor: '#faf6f3', '& .MuiLinearProgress-root': { filter: 'grayscale(1)' } } : undefined}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <FoodIcon type={food.type} brand={food.brand} size={60} empty={food.quantity === 0} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }} noWrap>{food.brand}</Typography>
                      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>{food.flavor}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {FOOD_TYPES[food.type]} · {food.weight_g} g{food.price != null && ` · ${food.price.toFixed(2)} zł`}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                      <Tooltip title={food.active ? 'Już nie kupuję – wycisz alerty' : 'Znowu kupuję – włącz alerty'}>
                        <IconButton size="small" onClick={() => toggleActive(food)}
                          aria-label={food.active ? 'Oznacz jako nieużywaną' : 'Oznacz jako używaną'}
                          color={food.active ? 'default' : 'primary'}>
                          {food.active ? <NotificationsOffRoundedIcon fontSize="small" /> : <NotificationsActiveRoundedIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => setDialog({ open: true, food })} aria-label="Edytuj"><EditRoundedIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => remove(food)} aria-label="Usuń"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <IconButton onClick={() => changeQty(food, -1)} disabled={food.quantity === 0} aria-label="Zużyłem jedną"
                      sx={{ bgcolor: '#fff1e6' }}><RemoveRoundedIcon /></IconButton>
                    <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ lineHeight: 1 }} data-testid="qty">{food.quantity}</Typography>
                      <Typography variant="caption" color="text.secondary">szt. (alarm ≤ {food.min_quantity})</Typography>
                    </Box>
                    <IconButton onClick={() => changeQty(food, 1)} aria-label="Dokupiłem jedną"
                      sx={{ bgcolor: '#fff1e6' }}><AddRoundedIcon /></IconButton>
                  </Box>
                  <LinearProgress variant="determinate" value={fill} color={status.color === 'success' || status.color === 'info' ? 'success' : status.color}
                    sx={{ height: 8, borderRadius: '16px', my: 1.5 }} />

                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    <Chip size="small" color={status.color} label={status.label} />
                    {food.expiry_date && (
                      <Chip size="small" variant="outlined" label={`ważne do ${formatDate(food.expiry_date)} (${relativeDays(food.expiry_date)})`} />
                    )}
                  </Stack>

                  {cats.length > 0 && (
                    <Stack spacing={0.5} sx={{ borderTop: '2px dashed #f6e3d6', pt: 1 }}>
                      {cats.map((cat) => (
                        <RatingRow key={cat.id} cat={cat} value={food.ratings?.[cat.id]} onRate={(r) => rate(food, cat, r)} />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <FoodDialog open={dialog.open} food={dialog.food} onClose={() => setDialog({ open: false, food: null })} onSave={save} />
    </>
  );
}
