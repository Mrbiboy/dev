import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (data.user_id) {
        toast.success("Inscription réussie !", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
        navigate("/dashboard");
      } else {
        toast.error(data.error || "Erreur lors de l'inscription", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Erreur lors de la connexion au serveur", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">Inscription</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-300 mb-1">
              Nom
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Entrez votre nom"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Entrez votre email"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Entrez votre mot de passe"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            S'inscrire
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;