import { createContext, useContext, useState, useCallback } from 'react';
import { BASE_URL } from '../utils/BaseURL';

export const SECCIONES = {
  ZONA_TRABAJO: 'zona-trabajo',
  CREAR_NOTA:   'crear-nota',
  PREMIUM:      'premium',
  PERFIL:       'perfil',
  PAPELERA:     'papelera'
};

const PageContext = createContext();

export const PageProvider = ({ children }) => {
  const [seccionActiva, setSeccionActiva] = useState(SECCIONES.ZONA_TRABAJO);
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const login = useCallback((tokenData, userData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUsuario(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUsuario(null);
  }, []);

  const cambiarSeccion = useCallback((seccion) => setSeccionActiva(seccion), []);

  // Recarga el perfil desde la API y actualiza el contexto + localStorage
  const refreshUsuario = useCallback(async (tkn) => {
    const t = tkn ?? token;
    if (!t) return;
    try {
      const res  = await fetch(`${BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data));
      setUsuario(data);
    } catch { /* silencioso */ }
  }, [token]);

  return (
    <PageContext.Provider value={{
      seccionActiva, cambiarSeccion,
      usuario, token,
      login, logout, refreshUsuario
    }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) throw new Error('usePage debe usarse dentro de un PageProvider');
  return context;
};