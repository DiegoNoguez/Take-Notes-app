import toast from "react-hot-toast";
import { BASE_URL } from "../utils/BaseURL";

export const iniciarSesion = async (email, password, loginFn) => {
  try {
    const respuesta = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      toast.error(data.error || "Credenciales incorrectas");
      return null;
    }

    loginFn(data.token, data.user);
    toast.success(`¡Bienvenido, ${data.user.nombre}!`); // ← nombre dinámico aquí
    return data;

  } catch (error) {
    console.error(error);
    toast.error("Error de conexión con el servidor");
    return null;
  }
};

export const registrarse = async (nombre, email, password) => {
  try {
    const respuesta = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });
    const data = await respuesta.json();
    if (respuesta.ok) {
      toast.success("Registro exitoso. Ahora inicia sesión.");
      return data;
    } else {
      toast.error(data.error || "No se pudo registrar el usuario");
    }
  } catch (error) {
    toast.error("Error de conexión con el servidor");
  }
};