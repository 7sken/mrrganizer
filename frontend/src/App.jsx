import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './lib/auth.jsx';
import Layout from './components/Layout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CatsPage from './pages/CatsPage.jsx';
import PantryPage from './pages/PantryPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import TasksPage from './pages/TasksPage.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Niezalogowany widzi tylko ekran logowania
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/koty" element={<CatsPage />} />
        <Route path="/spizarnia" element={<PantryPage />} />
        <Route path="/planer" element={<PlannerPage />} />
        <Route path="/zadania" element={<TasksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
