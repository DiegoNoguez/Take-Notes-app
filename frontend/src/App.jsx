import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { PageProvider, usePage, SECCIONES } from './context/PageContext';
import Login from './Pages/Login';
import ZonaTrabajo from './Pages/ZonaTrabajo';
import CrearNota from './Pages/CrearNota';
import Perfil from './Pages/Perfil';
import Premium from './Pages/Premium';
import Papelera from './Pages/Papelera';
import Header from './Components/Header';
import PanelSup from './Components/PanelSup';

const AppContent = () => {
  const { token, seccionActiva, cambiarSeccion } = usePage();

  // ─── Detecta retorno exitoso de Stripe (?payment=ok) ────────────────────────
  // Stripe redirige a success_url con ?payment=ok
  // Esperamos 2s para que el webhook procese la suscripción en BD
  // luego navegamos a Premium donde se recarga la suscripción activa
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'ok') {
      // Limpia ?payment=ok de la URL sin recargar la página
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        cambiarSeccion(SECCIONES.PREMIUM);
      }, 2000);
    }
  }, []);

  if (!token) return <Login />;

  const renderSeccion = () => {
    switch (seccionActiva) {
      case SECCIONES.CREAR_NOTA: return <CrearNota />;
      case SECCIONES.PREMIUM:    return <Premium />;
      case SECCIONES.PERFIL:     return <Perfil />;
      case SECCIONES.PAPELERA:   return <Papelera />;
      default:                   return <ZonaTrabajo />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <PanelSup />
      <main className="flex-1 p-6">
        {renderSeccion()}
      </main>
    </div>
  );
};

const App = () => (
  <PageProvider>
    <Toaster position="top-right" />
    <AppContent />
  </PageProvider>
);

export default App;