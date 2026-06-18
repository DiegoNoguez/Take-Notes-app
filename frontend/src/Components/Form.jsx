import { useState } from "react";
import { iniciarSesion, registrarse } from "../actions/FormActions";
import { usePage } from "../context/PageContext";

const Form = () => {
  const { login } = usePage();
  
  const [esRegistro, setEsRegistro] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre]     = useState("");

  const toggleModo = () => setEsRegistro(!esRegistro);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    if (esRegistro) {
      const ok = await registrarse(nombre, email, password);
      if (ok) {
        setNombre(""); setEmail(""); setPassword("");
        setEsRegistro(false);
      }
    } else {
      await iniciarSesion(email, password, login); // ← pasa login
    }
  };

  return (
    <form
      className="flex flex-col w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg"
      onSubmit={manejarSubmit}
    >
      <h2 className="text-3xl font-bold text-violet-600 text-center mb-6 ">
        {esRegistro ? "Crear cuenta" : "Iniciar sesión"}
      </h2>

      {esRegistro && (
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1" htmlFor="nombre">Nombre</label>
          <input
            id="nombre" type="text" value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            placeholder="Tu nombre" required
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-medium mb-1" htmlFor="email">Correo electrónico</label>
        <input
          id="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="ejemplo@correo.com" required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-1" htmlFor="password">Contraseña</label>
        <input
          id="password" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="********" required
        />
      </div>

      <button type="submit"
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition cursor-pointer"
      >
        {esRegistro ? "Registrarse" : "Iniciar sesión"}
      </button>

      <p className="text-sm text-center mt-4 text-gray-600">
        {esRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
        <button type="button" onClick={toggleModo}
          className="ml-1 text-violet-600 hover:text-violet-800 font-medium hover:underline focus:outline-none cursor-pointer"
        >
          {esRegistro ? "Inicia sesión aquí" : "Regístrate aquí"}
        </button>
      </p>
    </form>
  );
};

export default Form;