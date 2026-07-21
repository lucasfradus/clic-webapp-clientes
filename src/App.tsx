import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Consentimiento from './pages/Consentimiento';
import Home from './pages/Home';
import Agenda from './pages/Agenda';
import Cuenta from './pages/Cuenta';
import Perfil from './pages/Perfil';
import Novedades from './pages/Novedades';
import Acceso from './pages/Acceso';
import EditarPerfil from './pages/EditarPerfil';
import CambiarPassword from './pages/CambiarPassword';
import ConsentimientoFirmado from './pages/ConsentimientoFirmado';
import Politicas from './pages/Politicas';
import AutorizacionMenores from './pages/AutorizacionMenores';
import AutorizacionMenoresForm from './pages/AutorizacionMenoresForm';
import Toaster from './components/ui/Toaster';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Consentimiento: requiere token pero no consent ni autorización */}
        <Route
          element={
            <ProtectedRoute
              requireConsent={false}
              requireAutorizacionMenores={false}
            />
          }
        >
          <Route path="/consentimiento" element={<Consentimiento />} />
        </Route>

        {/* Autorización de menores (gate): requiere consent pero no autorización */}
        <Route element={<ProtectedRoute requireAutorizacionMenores={false} />}>
          <Route
            path="/autorizacion-menores"
            element={<AutorizacionMenoresForm />}
          />
        </Route>

        {/* Credencial de acceso: fullscreen, sin layout (tab bar) para el molinete */}
        <Route element={<ProtectedRoute />}>
          <Route path="/acceso" element={<Acceso />} />
        </Route>

        {/* Área protegida normal */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/cuenta" element={<Cuenta />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil/editar" element={<EditarPerfil />} />
            <Route path="/perfil/password" element={<CambiarPassword />} />
            <Route path="/perfil/consentimiento" element={<ConsentimientoFirmado />} />
            <Route path="/perfil/politicas" element={<Politicas />} />
            {/* Estado de la autorización de menores (con la autorización ya al día) */}
            <Route path="/perfil/autorizacion-menores" element={<AutorizacionMenores />} />
            <Route path="/perfil/autorizacion-menores/enviar" element={<AutorizacionMenoresForm />} />
            <Route path="/novedades" element={<Novedades />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
