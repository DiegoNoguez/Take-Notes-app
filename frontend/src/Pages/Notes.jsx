import React from 'react';
import Header from '../Components/Header';
import PanelSup from '../Components/PanelSup';
import { PageProvider, usePage, SECCIONES } from '../context/PageContext';

// Importamos los componentes de cada sección
import ZonaTrabajo from './ZonaTrabajo';
import CrearNota from './CrearNota';
import Premium from './Premium';
import Perfil from './Perfil';
import Papelera from './Papelera';

// Componente que renderiza la sección activa
const RenderSeccion = () => {
  const { seccionActiva } = usePage();

  switch (seccionActiva) {
    case SECCIONES.ZONA_TRABAJO:
      return <ZonaTrabajo />;
    case SECCIONES.CREAR_NOTA:
      return <CrearNota />;
    case SECCIONES.PREMIUM:
      return <Premium />;
    case SECCIONES.PERFIL:
      return <Perfil />;
    case SECCIONES.PAPELERA:
      return <Papelera />;
    default:
      return <ZonaTrabajo />;
  }
};

const Notes = () => {
  return (
    <PageProvider>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <PanelSup />
        <main className="flex-1 p-6">
          <RenderSeccion />
        </main>
      </div>
    </PageProvider>
  );
};

export default Notes;