// Kreator kota: imię, dane i wygląd z podglądem na żywo.
import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography,
  ToggleButton, ToggleButtonGroup, Stack, Tooltip,
} from '@mui/material';
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded';
import CatFace from './CatFace.jsx';
import { DEFAULT_AVATAR, FUR_COLORS, EYE_COLORS, PATTERNS, ACCESSORIES, randomAvatar } from '../lib/utils.js';

function ColorPicker({ label, value, colors, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{label}</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {colors.map((c) => (
          <Box key={c} component="button" type="button" onClick={() => onChange(c)} aria-label={`${label} ${c}`}
            sx={{
              width: 30, height: 30, borderRadius: '50%', bgcolor: c, cursor: 'pointer', p: 0,
              border: value === c ? '3px solid #ff8a65' : '2px solid #e0d0c8',
              transform: value === c ? 'scale(1.15)' : 'none', transition: 'transform .15s',
            }} />
        ))}
        <Tooltip title="Własny kolor">
          <Box component="input" type="color" value={value} onChange={(e) => onChange(e.target.value)}
            sx={{ width: 34, height: 34, border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: 0 }} />
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function CatEditor({ open, cat, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', birth_date: '', weight_kg: '', avatar: DEFAULT_AVATAR });
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(
        cat
          ? { name: cat.name, birth_date: cat.birth_date || '', weight_kg: cat.weight_kg ?? '', avatar: { ...DEFAULT_AVATAR, ...cat.avatar } }
          : { name: '', birth_date: '', weight_kg: '', avatar: randomAvatar() }
      );
      setError('');
    }
  }, [open, cat]);

  const setAvatar = (field, value) => value != null && setForm((f) => ({ ...f, avatar: { ...f.avatar, [field]: value } }));

  const submit = async () => {
    if (!form.name.trim()) return setError('Kot musi mieć imię!');
    try {
      await onSave({
        name: form.name.trim(),
        birth_date: form.birth_date || null,
        weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
        avatar: form.avatar,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>{cat ? `Edytuj: ${cat.name}` : 'Nowy kot 🐾'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 3, pt: 1 }}>
          <Stack spacing={2} sx={{ alignItems: "center", bgcolor: '#fff1e6', borderRadius: '16px', p: 2 }}>
            <CatFace avatar={form.avatar} size={200} name={form.name} />
            <Typography variant="h6">{form.name || 'Bezimienny'}</Typography>
            <Button startIcon={<CasinoRoundedIcon />} onClick={() => setForm((f) => ({ ...f, avatar: randomAvatar() }))}>
              Losuj wygląd
            </Button>
          </Stack>

          <Stack spacing={2.5}>
            <TextField label="Imię kota" value={form.name} autoFocus error={!!error} helperText={error}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Data urodzenia" type="date" value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Waga (kg)" type="number" value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                slotProps={{ htmlInput: { step: 0.1, min: 0 } }} />
            </Box>

            <ColorPicker label="Futro" value={form.avatar.fur} colors={FUR_COLORS} onChange={(c) => setAvatar('fur', c)} />

            <Box>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Umaszczenie</Typography>
              <ToggleButtonGroup exclusive size="small" value={form.avatar.pattern} onChange={(_, v) => setAvatar('pattern', v)} sx={{ flexWrap: 'wrap' }}>
                {PATTERNS.map((p) => <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>)}
              </ToggleButtonGroup>
            </Box>

            {form.avatar.pattern !== 'jednolity' && (
              <ColorPicker label="Kolor wzoru" value={form.avatar.patternColor} colors={FUR_COLORS}
                onChange={(c) => setAvatar('patternColor', c)} />
            )}

            <ColorPicker label="Oczy" value={form.avatar.eyes} colors={EYE_COLORS} onChange={(c) => setAvatar('eyes', c)} />

            <Box>
              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Dodatek</Typography>
              <ToggleButtonGroup exclusive size="small" value={form.avatar.accessory} onChange={(_, v) => setAvatar('accessory', v)} sx={{ flexWrap: 'wrap' }}>
                {ACCESSORIES.map((a) => <ToggleButton key={a.value} value={a.value}>{a.label}</ToggleButton>)}
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={submit}>Zapisz</Button>
      </DialogActions>
    </Dialog>
  );
}
