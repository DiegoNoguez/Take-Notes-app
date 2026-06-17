import { useState } from 'react';
import { BASE_URL } from '../utils/BaseURL';
import { usePage } from '../context/PageContext';
import { SECCIONES } from '../context/PageContext';
import toast from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';

const CrearNota = () => {
  const { token, cambiarSeccion } = usePage();
  const [titulo, setTitulo]       = useState('');
  const [contenido, setContenido] = useState('');
  const [enviando, setEnviando]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) { toast.error('No autenticado'); return; }
    setEnviando(true);
    try {
      const res = await fetch(`${BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ titulo, contenido })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear nota');
      }
      toast.success('Nota creada');
      cambiarSeccion(SECCIONES.ZONA_TRABAJO); // redirige a notas
    } catch (error) {
      toast.error(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700 tracking-tight">Nueva nota</h1>
        <p className="text-sm text-violet-300 mt-0.5">Escribe tu idea, tarea o apunte</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-violet-100 rounded-2xl p-6 shadow-sm shadow-violet-50">
        <div className="mb-5">
          <label className="block text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1.5">
            Título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Nombre de tu nota..."
            className="w-full text-gray-800 text-sm border-b border-violet-100 focus:border-pink-400 focus:outline-none pb-2 bg-transparent transition placeholder:text-gray-300"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-violet-500 uppercase tracking-wider mb-1.5">
            Contenido
          </label>
          <textarea
            value={contenido}
            onChange={e => setContenido(e.target.value)}
            rows={8}
            placeholder="Escribe aquí..."
            className="w-full text-gray-600 text-sm focus:outline-none bg-transparent resize-none leading-relaxed placeholder:text-gray-200"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-violet-50">
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition"
          >
            <PlusCircle size={15} />
            {enviando ? 'Guardando...' : 'Crear nota'}
          </button>
          <button
            type="button"
            onClick={() => cambiarSeccion(SECCIONES.ZONA_TRABAJO)}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CrearNota;