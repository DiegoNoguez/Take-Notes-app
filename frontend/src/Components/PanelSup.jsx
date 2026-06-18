import React from 'react';
import { usePage, SECCIONES } from '../context/PageContext';
import { FileText, PlusSquare, Layout, Star, User, Trash2 } from 'lucide-react';

const NAV_ITEMS = [
  { seccion: SECCIONES.ZONA_TRABAJO,  label: 'Notas',    icon: FileText  },
  { seccion: SECCIONES.CREAR_NOTA,    label: 'Nueva',    icon: PlusSquare },
  { seccion: SECCIONES.PREMIUM,       label: 'Premium',  icon: Star      },
  { seccion: SECCIONES.PERFIL,        label: 'Perfil',   icon: User      },
  { seccion: SECCIONES.PAPELERA,      label: 'Papelera', icon: Trash2    },
];

const PanelSup = () => {
  const { seccionActiva, cambiarSeccion } = usePage();

  return (
    <nav className="flex justify-center items-center gap-1 px-6 py-2 bg-white border-b border-gray-100">
      {NAV_ITEMS.map(({ seccion, label, icon: Icon }) => {
        const activo = seccionActiva === seccion;
        return (
          <button
            key={seccion}
            onClick={() => cambiarSeccion(seccion)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-pink-200 font-medium transition-all duration-150 cursor-pointer
              ${activo
                ? 'bg-violet-100 text-pink-700'
                : 'text-violet-500 hover:bg-pink-50 hover:text-pink-500'
              }`}
          >
            <Icon size={25} strokeWidth={activo ? 2.5 : 1.8} />
            {label}
          </button>
        );
      })}
    </nav>
  );
};

export default PanelSup;