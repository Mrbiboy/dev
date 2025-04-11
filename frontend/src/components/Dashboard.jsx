import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("http://127.0.0.1:5000/stats", {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError("Impossible de charger les données du tableau de bord");
        console.error("Erreur lors de la récupération des stats :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Filtrer les stats en fonction de la recherche (si nécessaire)
  const filteredStats = stats
    ? {
        policies: stats.policies,
        alerts: stats.alerts,
        securityScore: stats.securityScore,
      }
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4 sm:mb-0 flex items-center gap-2">
          <ChartBarIcon className="h-8 w-8 text-blue-400" />
          Tableau de Bord
        </h2>
        <div className="relative w-full sm:w-64">
          <label htmlFor="search-input" className="sr-only">
            Rechercher
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 placeholder-gray-400"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <MagnifyingGlassIcon className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Grille des cartes */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-400">Chargement des données...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-10 text-red-400">
          <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold text-gray-100 mb-2 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
              Politiques de sécurité
            </h3>
            <p className="text-3xl font-bold text-blue-400">{filteredStats.policies}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold text-gray-100 mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              Alertes de sécurité
            </h3>
            <p className="text-3xl font-bold text-red-400">{filteredStats.alerts}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-lg font-semibold text-gray-100 mb-2 flex items-center gap-2">
              <StarIcon className="h-5 w-5 text-green-400" />
              Score de sécurité
            </h3>
            <p className="text-3xl font-bold text-green-400">{filteredStats.securityScore}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;