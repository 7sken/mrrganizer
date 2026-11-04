// Formularz dodawania / edycji karmy.
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Stack,
  ToggleButton, ToggleButtonGroup, Alert,
} from '@mui/material';
import FoodIcon from './FoodIcon.jsx';
import { FOOD_TYPES } from '../lib/utils.js';

const EMPTY = { brand: '', flavor: '', type: 'mokra', weight_g: 85, quantity: 1, min_quantity: 2, price: '', expiry_date: '' };

export function validateFood(f) {
  const e = {};
  if (!f.brand.trim()) e.brand = 'Podaj markę';
  if (!f.flavor.trim()) e.flavor = 'Podaj smak';
  if (!(Number(f.weight_g) > 0)) e.weight_g = 'Gramatura > 0';
  if (Number(f.quantity) < 0 || !Number.isInteger(Number(f.quantity))) e.quantity = 'Liczba całkowita ≥ 0';
  if (Number(f.min_quantity) < 0) e.min_quantity = 'Min. 0';
  if (f.price !== '' && Number(f.price) < 0) e.price = 'Cena nie może być ujemna';
  return e;
}

export default function FoodDialog({ open, food, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(food ? { ...EMPTY, ...food, price: food.price ?? '', expiry_date: food.expiry_date ?? '' } : EMPTY);
      setErrors({});
      setServerError('');
    }
  }, [open, food]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async () => {
    const errs = validateFood(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await onSave({
        brand: form.brand.trim(),
        flavor: form.flavor.trim(),
        type: form.type,
        weight_g: Number(form.weight_g),
        quantity: Number(form.quantity),
        min_quantity: Number(form.min_quantity),
        price: form.price === '' ? null : Number(form.price),
        expiry_date: form.expiry_date || null,
      });
    } catch (e) {
      setServerError(e.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>{food ? 'Edytuj karmę' : 'Nowa karma do spiżarni'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FoodIcon type={form.type} brand={form.brand} size={64} />
            <ToggleButtonGroup exclusive value={form.type} onChange={(_, v) => v && setForm({ ...form, type: v })}>
              {Object.entries(FOOD_TYPES).map(([v, l]) => <ToggleButton key={v} value={v}>{l}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Marka" value={form.brand} onChange={set('brand')} error={!!errors.brand} helperText={errors.brand} autoFocus />
            <TextField label="Smak" value={form.flavor} onChange={set('flavor')} error={!!errors.flavor} helperText={errors.flavor} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Gramatura (g)" type="number" value={form.weight_g} onChange={set('weight_g')} error={!!errors.weight_g} helperText={errors.weight_g} />
            <TextField label="Cena (zł)" type="number" value={form.price} onChange={set('price')} error={!!errors.price} helperText={errors.price}
              slotProps={{ htmlInput: { step: 0.01, min: 0 } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Ile sztuk mam" type="number" value={form.quantity} onChange={set('quantity')} error={!!errors.quantity} helperText={errors.quantity} />
            <TextField label="Alarm, gdy zostanie" type="number" value={form.min_quantity} onChange={set('min_quantity')}
              error={!!errors.min_quantity} helperText={errors.min_quantity || 'sztuk lub mniej'} />
          </Box>
          <TextField label="Data ważności" type="date" value={form.expiry_date} onChange={set('expiry_date')}
            slotProps={{ inputLabel: { shrink: true } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={submit}>Zapisz</Button>
      </DialogActions>
    </Dialog>
  );
}
