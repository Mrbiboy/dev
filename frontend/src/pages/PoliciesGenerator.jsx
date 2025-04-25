import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { DocumentTextIcon, SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";

const PoliciesGenerator = () => {
  const location = useLocation();
  const selectedFiles = location.state?.selectedFiles || "";
  const [dockerfileInput, setDockerfileInput] = useState("");
  const [correctedDockerfile, setCorrectedDockerfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Populate textarea if files are passed
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const firstFile = selectedFiles[0];
      setDockerfileInput(firstFile.content);
    }
  }, [selectedFiles]);

  const correctDockerfile = async () => {
    setIsLoading(true);
    try {
      let accessToken = localStorage.getItem("token");
      const tokenExpiration = localStorage.getItem("token_expiration");

      if (!accessToken) {
        throw new Error("Utilisateur non authentifié. Veuillez vous connecter.");
      }

      if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }

        const refreshResponse = await fetch("http://127.0.0.1:5000/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        if (!refreshResponse.ok) {
          throw new Error("Impossible de rafraîchir le token. Veuillez vous reconnecter.");
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("token_expiration", Date.now() + 3600000);
      }

      const response = await fetch("http://127.0.0.1:5000/correct-dockerfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ dockerfile: dockerfileInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la requête au serveur.");
      }

      const data = await response.json();
      setCorrectedDockerfile(data.correction);
      toast.success("Dockerfile corrigé avec succès !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.message || "Erreur lors de la correction !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center flex-col">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          <DocumentTextIcon className="h-7 w-7 text-blue-400" />
          Correction de Dockerfile
        </h2>

        <div className="mb-6">
          <label htmlFor="dockerfile-input" className="text-gray-400 text-sm mb-2 block">
            Entrez votre Dockerfile :
          </label>
          <textarea
            id="dockerfile-input"
            value={dockerfileInput}
            onChange={(e) => setDockerfileInput(e.target.value)}
            className="w-full h-32 p-4 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200 font-mono"
            placeholder="FROM ubuntu:latest\nRUN apt-get update\n..."
          />
        </div>

        <button
          onClick={correctDockerfile}
          disabled={isLoading || !dockerfileInput.trim()}
          className={`w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
            isLoading || !dockerfileInput.trim() ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Correction en cours...
            </>
          ) : (
            <>
              <SparklesIcon className="h-5 w-5" />
              Corriger
            </>
          )}
        </button>

        {correctedDockerfile && (
          <div className="mt-6">
            <label htmlFor="dockerfile-output" className="text-gray-400 text-sm mb-2 block">
              Dockerfile corrigé :
            </label>
            <textarea
              id="dockerfile-output"
              value={correctedDockerfile}
              readOnly
              className="w-full h-64 p-4 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition-all duration-200 font-mono whitespace-pre"
              placeholder="La version corrigée apparaîtra ici..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliciesGenerator;