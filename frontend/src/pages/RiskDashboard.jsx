import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { toast } from "react-toastify";
import { ChartBarIcon, ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

// 📊 Enregistrement des composants de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RiskDashboard = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRisks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:5000/risks", {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = await response.json();
      console.log("📊 Données reçues :", data);

      if (!Array.isArray(data)) {
        throw new Error("Format inattendu des données");
      }

      setRisks(data);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des risques :", error);
      setError("Impossible de récupérer les risques");
      toast.error("Erreur lors du chargement des risques !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchRisks();
  };

  // 🎨 Configuration du graphique avec thème sombre
  const chartData = {
    labels: risks.map((risk) => risk.name),
    datasets: [
      {
        label: "Niveau de Risque (%)",
        data: risks.map((risk) => risk.level),
        backgroundColor: "rgba(239, 68, 68, 0.5)", // 🔴 Rouge clair pour les barres
        borderColor: "rgba(239, 68, 68, 1)", // 🔴 Rouge vif pour les bordures
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Niveau de Risque par Catégorie",
        color: "#f3f4f6", // Texte blanc cassé
        font: { size: 16 },
      },
      tooltip: {
        backgroundColor: "#1f2937", // Fond sombre pour les tooltips
        titleColor: "#f3f4f6",
        bodyColor: "#f3f4f6",
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" }, // Texte gris clair pour les labels X
        grid: { color: "#374151" }, // Grille gris foncé
      },
      y: {
        ticks: { color: "#9ca3af" }, // Texte gris clair pour les labels Y
        grid: { color: "#374151" }, // Grille gris foncé
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-full items-center justify-center flex flex-col">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <ChartBarIcon className="h-7 w-7 text-blue-400" />
            Dashboard de Risques
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 ${
              (loading || isRefreshing) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isRefreshing ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                Rafraîchissement...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-5 w-5" />
                Rafraîchir
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-400">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-4 text-red-400">
            <ExclamationCircleIcon className="h-6 w-6 mr-2" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <label htmlFor="risk-chart" className="text-gray-400 text-sm mb-2 block">
                Graphique des risques :
              </label>
              <Bar id="risk-chart" data={chartData} options={chartOptions} />
            </div>
            <ul className="space-y-3">
              {risks.map((risk, index) => (
                <li
                  key={index}
                  className="bg-gray-700 p-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200"
                >
                  <strong className="text-gray-100">{risk.name}</strong>:{" "}
                  <span className="text-red-400">{risk.level}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default RiskDashboard;