import { useState, useEffect, useRef } from 'react';
import { BASE_URL } from '../utils/BaseURL';
import { usePage } from '../context/PageContext';
import { User, Lock, AlertTriangle, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Perfil = () => {
  const { token, logout } = usePage();

  const [user, setUser]                     = useState(null);
  const [editando, setEditando]             = useState(false);
  const [nombre, setNombre]                 = useState('');
  const [email, setEmail]                   = useState('');
  const [notificaciones, setNotificaciones] = useState(true);
  const [oldPass, setOldPass]               = useState('');
  const [newPass, setNewPass]               = useState('');
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const deleteTimerRef                      = useRef(null);

  const obtenerPerfil = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUser(data);
      setNombre(data.nombre);
      setEmail(data.email);
      setNotificaciones(data.notificaciones_activas);
    } catch { toast.error('Error al cargar perfil'); }
  };

  useEffect(() => {
    obtenerPerfil();
    return () => { if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current); };
  }, []);

  const guardarPerfil = async () => {
    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, notificaciones_activas: notificaciones })
      });
      if (!res.ok) throw new Error('Error al actualizar');
      const data = await res.json();
      setUser(data);
      toast.success('Perfil actualizado');
      setEditando(false);
    } catch (err) { toast.error(err.message); }
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setNombre(user.nombre);
    setEmail(user.email);
    setNotificaciones(user.notificaciones_activas);
  };

  const toggleNotificaciones = async () => {
    const nuevo = !notificaciones;
    setNotificaciones(nuevo);
    try {
      const res = await fetch(`${BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, notificaciones_activas: nuevo })
      });
      if (!res.ok) throw new Error();
      toast.success(nuevo ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    } catch {
      setNotificaciones(!nuevo);
      toast.error('Error al actualizar notificaciones');
    }
  };

  const cambiarPass = async () => {
    if (!oldPass || !newPass) { toast.error('Completa ambos campos'); return; }
    try {
      const res = await fetch(`${BASE_URL}/user/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass })
      });
      if (!res.ok) throw new Error('Contraseña actual incorrecta');
      toast.success('Contraseña actualizada');
      setOldPass(''); setNewPass('');
    } catch (err) { toast.error(err.message); }
  };

  const eliminarCuenta = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      toast('Haz click de nuevo para confirmar. Esta acción no se puede deshacer.', {
        icon: '', duration: 5000,
      });
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 5000);
      return;
    }
    try {
      await fetch(`${BASE_URL}/user/account`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Cuenta eliminada');
      logout();
    } catch { toast.error('Error al eliminar cuenta'); }
  };

  if (!user) return (
    <div className="flex justify-center py-20">
      <span className="text-violet-400 text-sm animate-pulse">Cargando perfil...</span>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-2 py-6">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700 tracking-tight">Mi perfil</h1>
        <p className="text-sm text-violet-300 mt-0.5">{user.email}</p>
      </div>

      <div className="flex flex-col gap-4">

        {/* Notificaciones */}
        <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm shadow-violet-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                ${notificaciones ? 'bg-violet-50' : 'bg-gray-50'}`}>
                {notificaciones
                  ? <Bell size={15} className="text-violet-400" />
                  : <BellOff size={15} className="text-gray-300" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-700">Notificaciones</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {notificaciones
                    ? 'Recibirás recordatorios y avisos por email'
                    : 'No recibirás notificaciones por email'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNotificaciones}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none
                ${notificaciones ? 'bg-violet-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow
                               transition-transform duration-200
                               ${notificaciones ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Información personal - SIN form */}
        <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm shadow-violet-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
              <User size={15} className="text-violet-400" />
            </div>
            <h3 className="font-semibold text-violet-700 text-sm">Información personal</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-violet-400 mb-1">Nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                disabled={!editando}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="w-full text-sm text-gray-700 border-b border-violet-100 focus:border-pink-400
                           focus:outline-none pb-1.5 bg-transparent transition
                           disabled:text-gray-400 disabled:cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-violet-400 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                disabled={!editando}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="w-full text-sm text-gray-700 border-b border-violet-100 focus:border-pink-400
                           focus:outline-none pb-1.5 bg-transparent transition
                           disabled:text-gray-400 disabled:cursor-default"
              />
            </div>
            <div className="flex gap-2 pt-1">
              {!editando ? (
                <button type="button" onClick={() => setEditando(true)}
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium transition">
                  Editar perfil
                </button>
              ) : (
                <>
                  <button type="button" onClick={guardarPerfil}
                    className="text-sm bg-violet-600 hover:bg-violet-700 text-white
                               px-4 py-1.5 rounded-lg font-medium transition">
                    Guardar
                  </button>
                  <button type="button" onClick={cancelarEdicion}
                    className="text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5
                               rounded-lg border border-gray-100 transition">
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cambiar contraseña - SIN form */}
        <div className="bg-white border border-violet-100 rounded-2xl p-5 shadow-sm shadow-violet-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <Lock size={15} className="text-pink-400" />
            </div>
            <h3 className="font-semibold text-violet-700 text-sm">Cambiar contraseña</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-violet-400 mb-1">Contraseña actual</label>
              <input type="password" placeholder="••••••••" value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="w-full text-sm text-gray-700 border-b border-violet-100 focus:border-pink-400
                           focus:outline-none pb-1.5 bg-transparent transition placeholder:text-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-violet-400 mb-1">Nueva contraseña</label>
              <input type="password" placeholder="••••••••" value={newPass}
                onChange={e => setNewPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                className="w-full text-sm text-gray-700 border-b border-violet-100 focus:border-pink-400
                           focus:outline-none pb-1.5 bg-transparent transition placeholder:text-gray-200" />
            </div>
            <button type="button" onClick={cambiarPass}
              className="text-sm bg-violet-700 hover:bg-violet-800 text-white
                         px-4 py-1.5 rounded-lg font-medium transition">
              Actualizar contraseña
            </button>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="bg-white border border-pink-100 rounded-2xl p-5 shadow-sm shadow-pink-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
              <AlertTriangle size={15} className="text-pink-400" />
            </div>
            <h3 className="font-semibold text-pink-500 text-sm">Zona de peligro</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Esta acción eliminará tu cuenta y todos tus datos permanentemente.
          </p>
          <button type="button" onClick={eliminarCuenta}
            className={`text-sm border px-4 py-1.5 rounded-lg font-medium transition
              ${confirmDelete
                ? 'bg-pink-500 text-white border-pink-500 animate-pulse'
                : 'text-pink-500 hover:text-white hover:bg-pink-500 border-pink-300 hover:border-pink-500'
              }`}
          >
            {confirmDelete ? ' Confirmar eliminación' : 'Eliminar mi cuenta'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Perfil;