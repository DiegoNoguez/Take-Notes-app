import { createContext, useContext, useState, useCallback } from 'react';

export const SECCIONES = {
  ZONA_TRABAJO: 'zona-trabajo',
  CREAR_NOTA: 'crear-nota',
  PREMIUM: 'premium',
  PERFIL: 'perfil',
  PAPELERA: 'papelera'
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

  return (
    <PageContext.Provider value={{ seccionActiva, cambiarSeccion, usuario, token, login, logout }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (!context) throw new Error('usePage debe usarse dentro de un PageProvider');
  return context;
};
