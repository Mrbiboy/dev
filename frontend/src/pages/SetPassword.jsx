import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SetPassword = ({ user, setIsAuthenticated, setUser }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        toast.success("Mot de passe défini avec succès !", {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
        setIsAuthenticated(true);
        setUser(user);
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(data.error || "Échec de la définition du mot de passe", {
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
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-6">
          Définir votre mot de passe
        </h2>
        <p className="text-gray-300 text-center mb-4">
          Veuillez définir un mot de passe pour votre compte.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-gray-300 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
              placeholder="Confirmez votre mot de passe"
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
            {loading ? "Enregistrement..." : "Sauvegarder le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPassword; 