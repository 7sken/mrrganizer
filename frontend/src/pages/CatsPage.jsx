// Lista kotów z interaktywnymi awatarami + kreator wyglądu.
import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, IconButton, Chip, Stack, LinearProgress, Tooltip } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CatFace from '../components/CatFace.jsx';
import CatEditor from '../components/CatEditor.jsx';
import { PageHeader, EmptyState } from '../components/common.jsx';
import { useData } from '../lib/useData.js';
import { api } from '../lib/api.js';
import { useNotify } from '../lib/notify.jsx';
import { catAge, PATTERNS, ACCESSORIES } from '../lib/utils.js';

export default function CatsPage() {
  const { data: cats, loading, reload } = useData('/cats', []);
  const [editor, setEditor] = useState({ open: false, cat: null });
  const [pets, setPets] = useState({});
  const notify = useNotify();

  const save = async (body) => {
    if (editor.cat) await api.put(`/cats/${editor.cat.id}`, body);
    else await api.post('/cats', body);
    notify(editor.cat ? 'Zapisano zmiany' : `Witaj w domu, ${body.name}! 🎉`);
    setEditor({ open: false, cat: null });
    reload();
  };

  const remove = async (cat) => {
    if (!window.confirm(`Na pewno usunąć ${cat.name}? Plan karmienia i oceny tego kota też znikną.`)) return;
    await api.del(`/cats/${cat.id}`);
    notify('Usunięto kota', 'info');
    reload();
  };

  if (loading) return <LinearProgress />;

  return (
    <>
      <PageHeader title="Moje koty" subtitle="Kliknij kota, żeby go pogłaskać. Ołówek otwiera kreator wyglądu."
        action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditor({ open: true, cat: null })}>Dodaj kota</Button>} />

      {cats.length === 0 ? (
        <EmptyState text="Nie masz jeszcze żadnego kota. Czas to zmienić!" actionLabel="Dodaj pierwszego kota"
          onAction={() => setEditor({ open: true, cat: null })} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {cats.map((cat) => (
            <Card key={cat.id}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="Edytuj wygląd i dane">
                    <IconButton onClick={() => setEditor({ open: true, cat })} aria-label={`Edytuj ${cat.name}`}><EditRoundedIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Usuń">
                    <IconButton onClick={() => remove(cat)} aria-label={`Usuń ${cat.name}`}><DeleteOutlineRoundedIcon /></IconButton>
                  </Tooltip>
                </Box>
                <CatFace avatar={cat.avatar} size={170} name={cat.name}
                  onPet={() => setPets((p) => ({ ...p, [cat.id]: (p[cat.id] || 0) + 1 }))} />
                <Typography variant="h5">{cat.name}</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}>
                  {cat.birth_date && <Chip size="small" label={`🎂 ${catAge(cat.birth_date)}`} />}
                  {cat.weight_kg && <Chip size="small" label={`⚖️ ${cat.weight_kg} kg`} />}
                  <Chip size="small" variant="outlined" label={PATTERNS.find((p) => p.value === cat.avatar.pattern)?.label} />
                  {cat.avatar.accessory !== 'brak' && (
                    <Chip size="small" variant="outlined" label={ACCESSORIES.find((a) => a.value === cat.avatar.accessory)?.label} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {pets[cat.id] ? `Pogłaskany ${pets[cat.id]}× w tej sesji 💕` : 'Jeszcze nie pogłaskany…'}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <CatEditor open={editor.open} cat={editor.cat} onClose={() => setEditor({ open: false, cat: null })} onSave={save} />
    </>
  );
}
