import { useState, useEffect, useCallback } from 'react';
import { BASE_URL } from '../utils/BaseURL';
import { usePage } from '../context/PageContext';
import { FileText, Clock, Star, Pencil, Trash2, X, Check, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ZonaTrabajo = () => {
  const { token } = usePage();

  // ─── Estado principal ───────────────────────────────────────────────────────
  const [notas, setNotas]       = useState([]);
  const [cargando, setCargando] = useState(true);

  // editando: null = modal cerrado | objeto = nota abierta
  const [editando, setEditando] = useState(null);

  // ─── Estado del recordatorio de la nota abierta ─────────────────────────────
  const [reminder, setReminder]         = useState(null);  // datos del recordatorio actual
  const [remFecha, setRemFecha]         = useState('');    // input fecha
  const [remHora, setRemHora]           = useState('');    // input hora
  const [remMensaje, setRemMensaje]     = useState('');    // input mensaje
  const [remCargando, setRemCargando]   = useState(false); // cargando recordatorio

  // ─── Carga de notas (GET /notes) — excluye papelera por defecto ─────────────
  const cargarNotas = useCallback(() => {
    if (!token) return;
    fetch(`${BASE_URL}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { setNotas(data); setCargando(false); })
      .catch(() => { toast.error('Error al cargar notas'); setCargando(false); });
  }, [token]);

  useEffect(() => { cargarNotas(); }, [cargarNotas]);

  // ─── Abrir modal: carga nota + busca su recordatorio ────────────────────────
  const abrirEditor = async (nota) => {
    setEditando({ id_nota: nota.id_nota, titulo: nota.titulo, contenido: nota.contenido });
    setReminder(null); setRemFecha(''); setRemHora(''); setRemMensaje('');
    setRemCargando(true);

    // GET /notes/:id/reminder — puede devolver null si no tiene recordatorio
    try {
      const res  = await fetch(`${BASE_URL}/notes/${nota.id_nota}/reminder`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.id_recordatorio) {
        setReminder(data);
        setRemFecha(data.fecha   ?? '');
        setRemHora(data.hora     ?? '');
        setRemMensaje(data.mensaje ?? '');
      }
    } catch { /* sin recordatorio, no es crítico */ }
    finally { setRemCargando(false); }
  };

  // ─── Guardar edición de la nota (PUT /notes/:id) ────────────────────────────
  const guardarEdicion = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notes/${editando.id_nota}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ titulo: editando.titulo, contenido: editando.contenido })
      });
      if (!res.ok) throw new Error();
      toast.success('Nota actualizada');
      setEditando(null);
      cargarNotas();
    } catch { toast.error('Error al guardar'); }
  };

  // ─── Guardar o actualizar recordatorio (POST /notes/:id/reminder) ───────────
  const guardarRecordatorio = async () => {
    if (!remFecha || !remHora) { toast.error('Fecha y hora son obligatorias'); return; }
    try {
      const res = await fetch(`${BASE_URL}/notes/${editando.id_nota}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fecha: remFecha, hora: remHora, mensaje: remMensaje })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReminder(data); // actualiza el recordatorio local
      toast.success('Recordatorio guardado');
    } catch { toast.error('Error al guardar recordatorio'); }
  };

  // ─── Eliminar recordatorio (DELETE /notes/:id/reminder) ─────────────────────
  const eliminarRecordatorio = async () => {
    try {
      const res = await fetch(`${BASE_URL}/notes/${editando.id_nota}/reminder`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      setReminder(null); setRemFecha(''); setRemHora(''); setRemMensaje('');
      toast.success('Recordatorio eliminado');
    } catch { toast.error('Error al eliminar recordatorio'); }
  };

  // ─── Alternar favorito (PUT /notes/:id → { favorito: !actual }) ─────────────
  const toggleFavorito = async (nota) => {
    try {
      await fetch(`${BASE_URL}/notes/${nota.id_nota}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ favorito: !nota.favorito })
      });
      cargarNotas();
    } catch { toast.error('Error al actualizar favorito'); }
  };

  // ─── Mover a papelera (PUT /notes/:id → { papelera: true }) ─────────────────
  const moverPapelera = async (id) => {
    try {
      await fetch(`${BASE_URL}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ papelera: true })
      });
      toast.success('Nota movida a papelera');
      cargarNotas();
    } catch { toast.error('Error al mover a papelera'); }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div className="flex items-center justify-center py-20">
      <span className="text-violet-400 text-sm animate-pulse">Cargando notas...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-2 py-6">

      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700 tracking-tight">Mis notas</h1>
        <p className="text-sm text-violet-300 mt-0.5">
          {notas.length} nota{notas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {notas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <FileText size={24} className="text-violet-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No tienes notas aún</p>
          <p className="text-gray-300 text-xs mt-1">Crea tu primera nota desde Nueva</p>
        </div>
      ) : (

        /* ── Grid de tarjetas ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notas.map(nota => (
            <div
              key={nota.id_nota}
              className="group relative bg-white border border-violet-100 rounded-2xl p-4
                         hover:border-violet-300 hover:shadow-md hover:shadow-violet-100
                         transition-all duration-200"
            >
              {/* ── Header: título + acciones hover ──────────────────────── */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <FileText size={14} className="text-violet-300 mt-0.5 shrink-0" />
                  <h3 className="font-semibold text-violet-700 text-sm leading-snug line-clamp-1">
                    {nota.titulo || 'Sin título'}
                  </h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {/* Favorito */}
                  <button onClick={() => toggleFavorito(nota)}
                    className={`p-1 rounded-md transition ${nota.favorito ? 'text-pink-500' : 'text-gray-300 hover:text-pink-400 cursor-pointer'}`}>
                    <Star size={13} fill={nota.favorito ? 'currentColor' : 'none'} />
                  </button>
                  {/* Editar — abre modal con recordatorio */}
                  <button onClick={() => abrirEditor(nota)}
                    className="p-1 rounded-md text-gray-300 hover:text-violet-500 transition cursor-pointer">
                    <Pencil size={13} />
                  </button>
                  {/* Papelera — PUT papelera: true, no DELETE */}
                  <button onClick={() => moverPapelera(nota.id_nota)}
                    className="p-1 rounded-md text-gray-300 hover:text-pink-500 transition cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* ── Preview contenido ─────────────────────────────────────── */}
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 ml-5">
                {nota.contenido || 'Sin contenido'}
              </p>

              {/* ── Footer: fecha + favorito badge ────────────────────────── */}
              <div className="flex items-center justify-between mt-3 ml-5">
                <div className="flex items-center gap-1">
                  <Clock size={10} className="text-violet-200" />
                  <span className="text-xs text-violet-200">
                    {new Date(nota.fecha_modificacion).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                </div>
                {nota.favorito && (
                  <span className="text-xs text-pink-400 font-medium flex items-center gap-0.5">
                    <Star size={10} fill="currentColor" /> Favorita
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de edición + recordatorio ────────────────────────────────── */}
      {editando && (
        // Overlay — click fuera cierra sin guardar
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditando(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header modal ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-violet-50">
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Editando nota
              </span>
              <button onClick={() => setEditando(null)} className="text-gray-300 hover:text-gray-500 transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* ── Cuerpo: scroll interno ─────────────────────────────────── */}
            <div className="flex flex-col gap-4 px-6 py-5 flex-1 overflow-y-auto">

              {/* Input título */}
              <input
                className="w-full text-lg font-bold text-violet-700 border-b border-violet-100
                           focus:border-pink-400 focus:outline-none pb-2 bg-transparent transition
                           placeholder:text-violet-200"
                placeholder="Título de la nota..."
                value={editando.titulo}
                onChange={e => setEditando(prev => ({ ...prev, titulo: e.target.value }))}
              />

              {/* Textarea contenido — espacio generoso */}
              <textarea
                className="w-full text-sm text-gray-600 focus:outline-none bg-transparent
                           resize-none leading-relaxed placeholder:text-gray-200"
                style={{ minHeight: '30vh' }}
                placeholder="Escribe el contenido de tu nota..."
                value={editando.contenido}
                onChange={e => setEditando(prev => ({ ...prev, contenido: e.target.value }))}
              />

              {/* ── Sección recordatorio (GET/POST/DELETE /notes/:id/reminder) ── */}
              <div className="border-t border-violet-50 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-violet-400" />
                    <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
                      Recordatorio
                    </span>
                  </div>
                  {/* Eliminar recordatorio — DELETE /notes/:id/reminder */}
                  {reminder && (
                    <button
                      onClick={eliminarRecordatorio}
                      className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-600 transition cursor-pointer"
                    >
                      <BellOff size={12} /> Eliminar
                    </button>
                  )}
                </div>

                {remCargando ? (
                  <p className="text-xs text-violet-300 animate-pulse">Cargando recordatorio...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Fecha */}
                    <div>
                      <label className="block text-xs text-violet-400 mb-1">Fecha</label>
                      <input type="date" value={remFecha}
                        onChange={e => setRemFecha(e.target.value)}
                        className="w-full text-xs text-gray-600 border border-violet-100 rounded-lg
                                   px-2 py-1.5 focus:outline-none focus:border-pink-400 transition"
                      />
                    </div>
                    {/* Hora */}
                    <div>
                      <label className="block text-xs text-violet-400 mb-1">Hora</label>
                      <input
                        type="time"
                        value={remHora}
                        onChange={e => setRemHora(e.target.value)}
                        className="w-full text-xs text-gray-600 border border-violet-100 rounded-lg
                                   px-2 py-1.5 focus:outline-none focus:border-pink-400 transition"
                      />
                    </div>
                    {/* Mensaje — ocupa las 2 columnas */}
                    <div className="col-span-2">
                      <label className="block text-xs text-violet-400 mb-1">Mensaje (opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej: Revisar antes de la reunión"
                        value={remMensaje}
                        onChange={e => setRemMensaje(e.target.value)}
                        className="w-full text-xs text-gray-600 border border-violet-100 rounded-lg
                                   px-2 py-1.5 focus:outline-none focus:border-pink-400 transition
                                   placeholder:text-gray-200"
                      />
                    </div>
                    {/* Guardar recordatorio — POST /notes/:id/reminder */}
                    <div className="col-span-2">
                      <button
                        onClick={guardarRecordatorio}
                        className="flex items-center gap-1.5 text-xs bg-violet-50 hover:bg-violet-100
                                   text-violet-600 font-medium px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <Bell size={12} />
                        {reminder ? 'Actualizar recordatorio' : 'Agregar recordatorio'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer modal: guardar nota ─────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-violet-50">
              {/* Guardar nota — PUT /notes/:id */}
              <button
                onClick={guardarEdicion}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700
                           text-white text-sm font-semibold px-5 py-2 rounded-xl transition cursor-pointer"
              >
                <Check size={15} /> Guardar cambios
              </button>
              <button
                onClick={() => setEditando(null)}
                className="text-sm text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonaTrabajo;