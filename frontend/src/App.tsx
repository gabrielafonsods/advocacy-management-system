import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetail = lazy(() => import('./pages/CaseDetail'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Documents = lazy(() => import('./pages/Documents'));
const Deadlines = lazy(() => import('./pages/Deadlines'));
const Fees = lazy(() => import('./pages/Fees'));
const Contracts = lazy(() => import('./pages/Contracts'));
const Settings = lazy(() => import('./pages/Settings'));

const RouteFallback = () => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
    <span>Carregando ManuADV Juridico...</span>
  </div>
);

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />

          <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/processos" element={<Cases />} />
            <Route path="/processos/:id" element={<CaseDetail />} />
            <Route path="/agenda" element={<Calendar />} />
            <Route path="/documentos" element={<Documents />} />
            <Route path="/prazos" element={<Deadlines />} />
            <Route path="/honorarios" element={<Fees />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
