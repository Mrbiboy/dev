import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import GitHubComplianceChecker from "../components/ComplianceChecker/GitHubComplianceChecker";
import SelectedReposComplianceChecker from "../components/ComplianceChecker/SelectedReposComplianceChecker";
import CodeComplianceChecker from "../components/ComplianceChecker/CodeComplianceChecker";
import FileComplianceChecker from "../components/ComplianceChecker/FileComplianceChecker";
import ResultDisplay from "../components/ComplianceChecker/ResultDisplay";

const ComplianceChecker = () => {
  const [sourceType, setSourceType] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const selectedFiles = location.state?.selectedFiles || [];

  const resetChecker = () => {
    setSourceType(null);
    setResult(null);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl p-8">
        {!sourceType ? (
          <>
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
              <CheckCircleIcon className="h-7 w-7 text-green-400" />
              Sélectionner la source à vérifier
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <button
                onClick={() => setSourceType("selected_repos")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.135 1.838 1.24 1.838 1.24 1.065 1.885 2.876 1.34 3.578 1.025.112-.795.434-1.34.792-1.645-2.776-.315-5.686-1.385-5.686-6.165 0-1.365.487-2.48 1.287-3.355-.13-.315-.558-1.585.123-3.305 0 0 1.05-.335 3.44 1.285A12.01 12.01 0 0112 4.8c1.065.005 2.135.145 3.14.43 2.39-1.62 3.435-1.285 3.435-1.285.685 1.72.255 2.99.125 3.305.805.875 1.285 1.99 1.285 3.355 0 4.795-2.915 5.845-5.695 6.155.445.385.84 1.145.84 2.31 0 1.665-.015 3.015-.015 3.42 0 .32.215.695.825.575C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Dépôts Sélectionnés
              </button>
              <button
                onClick={() => setSourceType("github")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.135 1.838 1.24 1.838 1.24 1.065 1.885 2.876 1.34 3.578 1.025.112-.795.434-1.34.792-1.645-2.776-.315-5.686-1.385-5.686-6.165 0-1.365.487-2.48 1.287-3.355-.13-.315-.558-1.585.123-3.305 0 0 1.05-.335 3.44 1.285A12.01 12.01 0 0112 4.8c1.065.005 2.135.145 3.14.43 2.39-1.62 3.435-1.285 3.435-1.285.685 1.72.255 2.99.125 3.305.805.875 1.285 1.99 1.285 3.355 0 4.795-2.915 5.845-5.695 6.155.445.385.84 1.145.84 2.31 0 1.665-.015 3.015-.015 3.42 0 .32.215.695.825.575C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Dépôt GitHub
              </button>
              <button
                onClick={() => setSourceType("code")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Code
              </button>
              <button
                onClick={() => setSourceType("file")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Fichier ou ZIP
              </button>
            </div>
          </>
        ) : (
          <>
            {sourceType === "selected_repos" && (
              <SelectedReposComplianceChecker setResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {sourceType === "github" && (
              <GitHubComplianceChecker setResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {sourceType === "code" && (
              <CodeComplianceChecker
                setResult={setResult}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                preSelectedFiles={selectedFiles}
              />
            )}
            {sourceType === "file" && (
              <FileComplianceChecker setResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            <ResultDisplay result={result} />
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetChecker}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Retour
              </button>
              <button
                onClick={() => setResult(null)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
                style={{ display: result ? "flex" : "none" }}
              >
                <CheckCircleIcon className="h-5 w-5" />
                Effacer le résultat
              </button>
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default ComplianceChecker;