// Zadania (to-do) + automatyczna lista zakupów z tego, co się kończy.
import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Stack, LinearProgress, TextField, MenuItem,
  Checkbox, List, ListItem, ListItemIcon, ListItemText, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ShoppingCartCheckoutRoundedIcon from '@mui/icons-material/ShoppingCartCheckoutRounded';
import CatFace from '../components/CatFace.jsx';
import FoodIcon from '../components/FoodIcon.jsx';
import { PageHeader, SectionCard } from '../components/common.jsx';
import { useData } from '../lib/useData.js';
import { api } from '../lib/api.js';
import { useNotify } from '../lib/notify.jsx';
import { TASK_CATEGORIES, relativeDays, todayIso } from '../lib/utils.js';

const EMPTY_TASK = { title: '', category: 'inne', due_date: '', cat_id: '' };

export default function TasksPage() {
  const { data: tasks, loading, reload } = useData('/tasks', []);
  const { data: shopping, reload: reloadShopping } = useData('/foods/shopping-list', []);
  const { data: cats } = useData('/cats', []);
  const [form, setForm] = useState(EMPTY_TASK);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todo');
  const notify = useNotify();
  const today = todayIso();

  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));
  const visible = tasks.filter((t) => (filter === 'todo' ? !t.done : t.done));
  const total = shopping.reduce((s, f) => s + (f.price || 0) * f.to_buy, 0);

  const add = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Wpisz, co trzeba zrobić');
    setError('');
    await api.post('/tasks', {
      title: form.title.trim(),
      category: form.category,
      due_date: form.due_date || null,
      cat_id: form.cat_id === '' ? null : Number(form.cat_id),
    });
    setForm(EMPTY_TASK);
    notify('Dodano zadanie ✍️');
    reload();
  };

  const toggle = async (task) => {
    await api.patch(`/tasks/${task.id}/toggle`);
    if (!task.done) notify('Zrobione! Kot jest z Ciebie dumny 😸');
    reload();
  };

  const remove = async (task) => {
    await api.del(`/tasks/${task.id}`);
    reload();
  };

  const bought = async (food) => {
    await api.patch(`/foods/${food.id}/quantity`, { change: food.to_buy });
    notify(`+${food.to_buy} × ${food.brand} ${food.flavor} w spiżarni 🛒`);
    reloadShopping();
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      <PageHeader title="Zadania i zakupy" subtitle="Weterynarz, żwirek, odrobaczanie – i lista tego, co trzeba dokupić." />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 3, alignItems: 'start' }}>
        <SectionCard title="Do zrobienia" emoji="📝"
          action={
            <ToggleButtonGroup size="small" exclusive value={filter} onChange={(_, v) => v && setFilter(v)}>
              <ToggleButton value="todo">Aktualne ({tasks.filter((t) => !t.done).length})</ToggleButton>
              <ToggleButton value="done">Zrobione</ToggleButton>
            </ToggleButtonGroup>
          }>
          <Box component="form" onSubmit={add} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '2fr 1fr 1fr 1fr auto' }, gap: 1, mb: 2 }}>
            <TextField label="Co trzeba zrobić?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={!!error} helperText={error} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
            <TextField select label="Kategoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(TASK_CATEGORIES).map(([v, c]) => <MenuItem key={v} value={v}>{c.emoji} {c.label}</MenuItem>)}
            </TextField>
            <TextField select label="Kot" value={form.cat_id} onChange={(e) => setForm({ ...form, cat_id: e.target.value })}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">— wszystkie —</MenuItem>
              {cats.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <TextField label="Termin" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }} />
            <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />} sx={{ height: 40 }}>Dodaj</Button>
          </Box>

          {visible.length === 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CatFace size={70} mood="happy" />
              <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                {filter === 'todo' ? 'Pusto! Można iść na drzemkę.' : 'Nic jeszcze nie odhaczone.'}
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {visible.map((t) => {
                const overdue = !t.done && t.due_date && t.due_date < today;
                return (
                  <ListItem key={t.id} disableGutters divider
                    secondaryAction={<IconButton edge="end" onClick={() => remove(t)} aria-label="Usuń zadanie"><DeleteOutlineRoundedIcon /></IconButton>}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Checkbox edge="start" checked={t.done} onChange={() => toggle(t)}
                        slotProps={{ input: { 'aria-label': `Zrobione: ${t.title}` } }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<><span style={{ marginRight: 6 }}>{TASK_CATEGORIES[t.category]?.emoji}</span>{t.title}</>}
                      secondary={
                        <Stack direction="row" spacing={1} component="span" sx={{ mt: 0.5, alignItems: 'center' }}>
                          {t.due_date && (
                            <Chip component="span" size="small" label={relativeDays(t.due_date, today)}
                              color={overdue ? 'error' : t.due_date === today ? 'warning' : 'default'} />
                          )}
                          {t.cat_id && catById[t.cat_id] && (
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                              <CatFace avatar={catById[t.cat_id].avatar} size={22} interactive={false} />
                              <span>{t.cat_name}</span>
                            </Box>
                          )}
                        </Stack>
                      }
                      sx={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}
                      slotProps={{ primary: { sx: { fontWeight: 700 } }, secondary: { component: 'span' } }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </SectionCard>

        <SectionCard title="Lista zakupów" emoji="🛒" sx={{ bgcolor: '#fffdf7' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Tworzy się sama z karm, których zostało mało. „Kupione” dodaje sztuki do spiżarni.
          </Typography>
          {shopping.length === 0 ? (
            <Typography sx={{ fontWeight: 700, py: 2 }}>Nic nie trzeba kupować 🎉</Typography>
          ) : (
            <>
              <List dense disablePadding>
                {shopping.map((f) => (
                  <ListItem key={f.id} disableGutters
                    secondaryAction={
                      <Button size="small" variant="outlined" startIcon={<ShoppingCartCheckoutRoundedIcon />} onClick={() => bought(f)}>
                        Kupione
                      </Button>
                    }>
                    <ListItemIcon sx={{ minWidth: 44 }}><FoodIcon type={f.type} brand={f.brand} size={34} /></ListItemIcon>
                    <ListItemText primary={`${f.to_buy} × ${f.brand}`} secondary={`${f.flavor} · masz ${f.quantity}`}
                      slotProps={{ primary: { sx: { fontWeight: 700 } } }} sx={{ pr: 12 }} />
                  </ListItem>
                ))}
              </List>
              {total > 0 && (
                <Typography sx={{ mt: 1, fontWeight: 800, textAlign: 'right' }}>
                  Szacunkowo: {total.toFixed(2)} zł
                </Typography>
              )}
            </>
          )}
        </SectionCard>
      </Box>
    </>
  );
}
