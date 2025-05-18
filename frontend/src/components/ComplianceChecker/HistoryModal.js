import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import ResultDisplay from "./ResultDisplay"; // Import ResultDisplay
import { XCircleIcon } from "@heroicons/react/24/outline";

const HistoryModal = ({ isOpen, onClose, userId }) => {
  const [history, setHistory] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null); // State for selected scan
  const [isLoading, setIsLoading] = useState(false);

  // Fetch scan history when modal opens
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://127.0.0.1:5000/history", {
          headers: {
            "X-User-ID": userId,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHistory(data);
        } else {
          toast.error("Erreur lors de la récupération de l'historique", {
            position: "top-right",
            autoClose: 2000,
            theme: "dark",
          });
        }
      } catch (error) {
        toast.error("Erreur réseau", {
          position: "top-right",
          autoClose: 2000,
          theme: "dark",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, userId]);

  // Format date to a readable format
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle card click to show scan details
  const handleCardClick = (scan) => {
    scan.ItemName = scan.repo_url
                    ? scan.repo_url.split("/").slice(-2).join("/")
                    : (scan.item_name ? scan.item_name : "Fichier ")
    setSelectedScan(scan);
  };

  // Close scan details
  const closeScanDetails = () => {
    setSelectedScan(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Historique des scans</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-400">Chargement...</p>
        ) : history.length === 0 ? (
          <p className="text-gray-400">Aucun historique disponible.</p>
        ) : !selectedScan ? (
          <div className="grid grid-cols-1 gap-4">
            {history.map((scan) => (
              <div
                key={scan.id}
                onClick={() => handleCardClick(scan)}
                className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-100">
                  {scan.repo_url
                    ? scan.repo_url.split("/").slice(-2).join("/")
                    : (scan.item_name ? scan.item_name : "Fichier ")}
                </h3>
                <p className="text-gray-300">Status: {scan.status}</p>
                <p className="text-gray-300">Score: {scan.score}%</p>
                <p className="text-gray-300">Conforme: {scan.compliant ? "Oui" : "Non"}</p>
                <p className="text-gray-400 text-sm">
                  Date: {formatDate(scan.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={closeScanDetails}
              className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200"
            >
              Retour à l'historique
            </button>
            <ResultDisplay result={selectedScan.scan_result.results}  item_name= {selectedScan.ItemName}  />
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryModal;