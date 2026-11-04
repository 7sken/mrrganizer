// Wspólne małe komponenty UI
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import CatFace from './CatFace.jsx';

export function PageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4">{title}</Typography>
        {subtitle && <Typography color="text.secondary" sx={{ fontWeight: 600 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

export function EmptyState({ text, actionLabel, onAction, mood = 'meh' }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 5 }}>
        <CatFace size={120} mood={mood} />
        <Typography sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center' }}>{text}</Typography>
        {actionLabel && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
      </CardContent>
    </Card>
  );
}

export function SectionCard({ title, emoji, children, action, sx }) {
  return (
    <Card sx={sx}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {emoji && <span style={{ marginRight: 8 }}>{emoji}</span>}
            {title}
          </Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}
