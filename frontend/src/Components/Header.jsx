import { NotepadText, LogOut } from 'lucide-react';
import { usePage } from '../context/PageContext';

const Header = () => {
  const { usuario, logout } = usePage();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-green-800 border-b rounded-3xl mt-3 mx-2">
      <div className="flex items-center gap-2">
        <NotepadText size={50} className="text-pink-400" />
        <span className="font-semibold text-white text-2xl tracking-tight">Take Notes</span>
      </div>

      {usuario && (
        <div className="flex items-center gap-3">
          <span className="text-2xl text-white capitalize">
            {usuario.nombre}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-pink-300 hover:text-pink-100 transition cursor-pointer"
          >
            <LogOut size={48} />
            Salir
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;