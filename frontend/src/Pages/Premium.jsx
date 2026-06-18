import { useState, useEffect } from 'react';
import { BASE_URL } from '../utils/BaseURL';
import { usePage } from '../context/PageContext';
import { Star, Zap, Building2, Check, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const PLAN_META = {
  Gratuito: { icon: Star,      color: 'text-violet-400', bg: 'bg-violet-50'  },
  Pro:      { icon: Zap,       color: 'text-pink-500',   bg: 'bg-pink-50'    },
  Empresa:  { icon: Building2, color: 'text-violet-600', bg: 'bg-violet-100' },
};

const Premium = () => {
  const { token, refreshUsuario } = usePage();

  const [planes, setPlanes]           = useState([]);
  const [suscripcion, setSuscripcion] = useState(null);
  const [cargando, setCargando]       = useState(true);
  const [procesando, setProcesando]   = useState(null);
  const [ciclo, setCiclo]             = useState('mensual');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const cargarSuscripcion = async () => {
    try {
      const res = await fetch(`${BASE_URL}/subscription/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = res.ok ? await res.json() : null;
      setSuscripcion(data);
    } catch { setSuscripcion(null); }
  };

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token}` };

    fetch(`${BASE_URL}/plans`, { headers })
      .then(r => r.json())
      .then(data => { setPlanes(data); setCargando(false); })
      .catch(() => { toast.error('Error al cargar planes'); setCargando(false); });

    cargarSuscripcion();

    // Workaround webhook Stripe: espera 3s y recarga suscripción + perfil
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'ok') {
      window.history.replaceState({}, '', window.location.pathname);
      toast.success('¡Pago exitoso! Activando tu plan...');
      setTimeout(async () => {
        await cargarSuscripcion();
        await refreshUsuario(); // ← actualiza plan_actual en el contexto y perfil
      }, 3000);
    }
  }, [token]);

  const suscribirse = async (planId) => {
    setProcesando(planId);
    try {
      const res = await fetch(`${BASE_URL}/subscription/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id:     planId,
          ciclo,
          success_url: `${window.location.origin}?payment=ok`,
          cancel_url:  `${window.location.origin}?seccion=premium`,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar pago');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(null);
    }
  };

  // Doble click para confirmar cancelación, sin confirm() nativo
  const cancelarSuscripcion = async () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      toast('Haz click de nuevo para confirmar la cancelación.', {
        icon: '', duration: 5000,
      });
      setTimeout(() => setConfirmCancel(false), 5000);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/subscription/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Suscripción cancelada');
      setSuscripcion(null);
      await refreshUsuario(); // ← actualiza perfil tras cancelar
    } catch {
      toast.error('No se pudo cancelar');
    }
  };

  if (cargando) return (
    <div className="flex justify-center py-20">
      <span className="text-violet-400 text-sm animate-pulse">Cargando planes...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-2 py-6">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700 tracking-tight">Planes Premium</h1>
        <p className="text-sm text-violet-300 mt-0.5">Elige el plan que mejor se adapte a ti</p>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center bg-white border border-violet-100 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setCiclo('mensual')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer
              ${ciclo === 'mensual'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-violet-600'}`}
          >
            <Calendar size={13} /> Mensual
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer
              ${ciclo === 'anual'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-violet-600'}`}
          >
            <Calendar size={13} /> Anual
            <span className="ml-1 text-xs bg-pink-100 text-pink-500 px-1.5 py-0.5 rounded-full font-semibold">
              Ahorra más
            </span>
          </button>
        </div>
      </div>

      {suscripcion && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-100
                        rounded-2xl px-5 py-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-violet-700">
              Plan activo: <span className="text-pink-500">{suscripcion.nombre ?? 'Pro'}</span>
            </p>
            <p className="text-xs text-violet-300 mt-0.5">
              {suscripcion.fecha_fin
                ? `Renovación: ${new Date(suscripcion.fecha_fin).toLocaleDateString('es-MX')}`
                : 'Sin fecha de vencimiento'}
            </p>
          </div>
          <button
            type="button"
            onClick={cancelarSuscripcion}
            className={`text-xs font-medium border px-3 py-1.5 rounded-lg transition cursor-pointer
              ${confirmCancel
                ? 'bg-pink-500 text-white border-pink-500 animate-pulse'
                : 'text-pink-400 hover:text-pink-600 border-pink-200 hover:border-pink-400'}`}
          >
            {confirmCancel ? ' Confirmar cancelación' : 'Cancelar plan'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {planes.map(plan => {
          const meta     = PLAN_META[plan.nombre] ?? PLAN_META['Pro'];
          const Icon     = meta.icon;
          const esActivo = suscripcion?.id_plan === plan.id_plan;
          const precio   = ciclo === 'anual' ? plan.precio_anual : plan.precio_mensual;
          const labelCiclo = ciclo === 'anual' ? '/año' : '/mes';

          return (
            <div
              key={plan.id_plan}
              className={`relative flex flex-col bg-white border rounded-2xl p-5 transition-all duration-200
                ${esActivo
                  ? 'border-pink-300 shadow-md shadow-pink-100'
                  : 'border-violet-100 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100'}`}
            >
              {esActivo && (
                <span className="absolute top-3 right-3 text-xs bg-pink-100 text-pink-500
                                 font-semibold px-2 py-0.5 rounded-full">
                  Activo
                </span>
              )}

              <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center mb-4`}>
                <Icon size={18} className={meta.color} />
              </div>
              <h3 className="font-bold text-violet-700 text-base mb-1">{plan.nombre}</h3>

              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-800">
                  ${precio}
                  <span className="text-sm font-normal text-gray-400">{labelCiclo}</span>
                </p>
                {plan.precio_anual > 0 && ciclo === 'mensual' && (
                  <p className="text-xs text-violet-300 mt-0.5">
                    o ${plan.precio_anual}/año
                    <span className="ml-1 text-pink-400 font-medium">
                      (ahorra {Math.round(100 - (plan.precio_anual / (plan.precio_mensual * 12)) * 100)}%)
                    </span>
                  </p>
                )}
                {ciclo === 'anual' && plan.precio_mensual > 0 && (
                  <p className="text-xs text-violet-300 mt-0.5">
                    equivale a ${(plan.precio_anual / 12).toFixed(0)}/mes
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-1.5 mb-5">
                {plan.nombre === 'Gratuito' && (<>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-violet-400" /> Hasta 10 notas</li>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-violet-400" /> Acceso básico</li>
                </>)}
                {plan.nombre === 'Pro' && (<>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-pink-400" /> Notas ilimitadas</li>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-pink-400" /> Recordatorios a correo registrado</li>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-pink-400" /> Soporte prioritario</li>
                </>)}
                {plan.nombre === 'Empresa' && (<>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-violet-600" /> Todo lo de Pro</li>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-violet-600" /> Integración con Agentes de IA</li>
                  <li className="flex items-center gap-2 text-xs text-gray-500"><Check size={12} className="text-violet-600" /> API dedicada</li>
                </>)}
              </ul>

              <button
                type="button"
                onClick={() => suscribirse(plan.id_plan)}
                disabled={esActivo || procesando === plan.id_plan || plan.precio_mensual === 0}
                className={`w-full py-2 rounded-xl text-sm font-semibold transition cursor-pointer
                  ${esActivo || plan.precio_mensual === 0
                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
              >
                {procesando === plan.id_plan ? 'Redirigiendo...'
                  : esActivo            ? 'Plan actual'
                  : plan.precio_mensual === 0 ? 'Plan gratuito'
                  : `Suscribirse ${ciclo}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Premium;