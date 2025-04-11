import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const Login = ({ setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        console.log("✅ Login success:", data);

        // Stocker les tokens et les informations utilisateur
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token); // Ajout du refresh_token
        localStorage.setItem("token_expiration", Date.now() + 3600000); // 1 heure
        localStorage.setItem("user", JSON.stringify(data.user));

        setIsAuthenticated(true);
        setUser(data.user);

        toast.success("Connexion réussie !", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });

        console.log("🔄 Redirection vers le Dashboard...");
        navigate("/dashboard");
      } else {
        toast.error(data.error || "Échec de la connexion", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } catch (error) {
      toast.error("Erreur de connexion au serveur", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md z-10">
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">Connexion</h2>
        <form onSubmit={handleLogin}>
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
            disabled={loading}
            className={`w-full bg-blue-600 text-white p-2 rounded-lg font-semibold transition-colors duration-200 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-gray-400 mt-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;