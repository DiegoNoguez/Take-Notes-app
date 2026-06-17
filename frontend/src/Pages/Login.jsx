import React from "react";
import Header from "../Components/Header";
import Form from "../Components/Form";
import image from "../utils/images/notes.png"; // Ruta a la imagen 

const Login = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex-1 relative flex items-center justify-center px-4 py-8">
        {/* Fondo con la imagen (opacidad 20% para no tapar el formulario) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${image})` }}
        />
        {/* Formulario (por encima del fondo) */}
        <div className="relative z-10 w-full max-w-md">
          <Form />
        </div>
      </div>
    </div>
  );
};

export default Login;