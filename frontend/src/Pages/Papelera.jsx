import { useState, useEffect } from 'react';
import { BASE_URL } from '../utils/BaseURL';
import { usePage } from '../context/PageContext';
import { Trash2, RotateCcw, FileText, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Papelera = () => {
  const { token } = usePage();

  // ─── Estado ─────────────────────────────────────────────────────────────────
  const [notas, setNotas]       = useState([]);
  const [cargando, setCargando] = useState(true);

  // ─── Cargar notas en papelera (GET /notes?trash=1) ──────────────────────────
  // Filtramos en frontend también por papelera === true como seguro extra
  const obtenerPapelera = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/notes?trash=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar papelera');
      const data = await res.json();

      // Filtro defensivo: solo notas con papelera = true
      setNotas(data.filter(n => n.papelera === true));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { obtenerPapelera(); }, []);

  // ─── Restaurar nota (PUT /notes/:id → { papelera: false }) ──────────────────
  const restaurar = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ papelera: false })
      });
      if (!res.ok) throw new Error();
      toast.success('Nota restaurada');
      setNotas(prev => prev.filter(n => n.id_nota !== id)); // quita de la lista local
    } catch { toast.error('Error al restaurar'); }
  };

  // ─── Eliminar definitivamente (DELETE /notes/:id) ───────────────────────────
  const eliminar = async (id) => {
    if (!confirm('¿Eliminar para siempre? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Eliminada permanentemente');
      setNotas(prev => prev.filter(n => n.id_nota !== id)); // quita de la lista local
    } catch { toast.error('Error al eliminar'); }
  };

  if (cargando) return (
    <div className="flex justify-center py-20">
      <span className="text-violet-400 text-sm animate-pulse">Cargando papelera...</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-2 py-6">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700 tracking-tight">Papelera</h1>
        <p className="text-sm text-violet-300 mt-0.5">
          {notas.length === 0 ? 'Vacía' : `${notas.length} nota${notas.length !== 1 ? 's' : ''} eliminada${notas.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {notas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-violet-200" />
          </div>
          <p className="text-gray-400 text-sm font-medium">La papelera está vacía</p>
          <p className="text-gray-300 text-xs mt-1">Las notas eliminadas aparecerán aquí</p>
        </div>
      ) : (

        /* ── Lista de notas en papelera ───────────────────────────────────── */
        <div className="flex flex-col gap-3">
          {notas.map(nota => (
            <div
              key={nota.id_nota}
              className="flex items-start justify-between gap-4 bg-white border border-violet-100
                         rounded-2xl px-5 py-4 hover:border-violet-200 transition"
            >
              {/* ── Info de la nota ───────────────────────────────────────── */}
              <div className="flex items-start gap-3 min-w-0">
                <FileText size={15} className="text-violet-200 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-600 text-sm line-clamp-1">
                    {nota.titulo || 'Sin título'}
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 mt-0.5">
                    {nota.contenido || 'Sin contenido'}
                  </p>
                  {/* Fecha de modificación */}
                  <div className="flex items-center gap-1 mt-2">
                    <Clock size={10} className="text-violet-200" />
                    <span className="text-xs text-violet-200">
                      {new Date(nota.fecha_modificacion).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Acciones: restaurar + eliminar ────────────────────────── */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Restaurar — PUT /notes/:id → { papelera: false } */}
                <button
                  onClick={() => restaurar(nota.id_nota)}
                  className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-700
                             border border-violet-100 hover:border-violet-300
                             px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                >
                  <RotateCcw size={12} /> Restaurar
                </button>
                {/* Eliminar definitiva — DELETE /notes/:id */}
                <button
                  onClick={() => eliminar(nota.id_nota)}
                  className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-600
                             border border-pink-100 hover:border-pink-300
                             px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                >
                  <Trash2 size={12} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Papelera;