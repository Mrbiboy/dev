import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const GitHubComplianceChecker = ({ setResult, isLoading, setIsLoading }) => {
  const [url, setUrl] = useState("");

  const checkCompliance = async () => {
    if (!url || !url.includes("github.com")) {
      toast.warn("Veuillez entrer une URL de dépôt GitHub valide (ex. https://github.com/user/repo) !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/checkov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la vérification");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Vérification terminée avec succès !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.message || "Erreur lors de la vérification !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
        <CheckCircleIcon className="h-7 w-7 text-green-400" />
        Validation et Conformité - GitHub (NIST, ISO 27001, GDPR, HIPAA)
      </h2>
      <div className="relative mb-6">
        <label htmlFor="github-url" className="text-gray-400 text-sm mb-2 block">
          URL du dépôt GitHub :
        </label>
        <input
          id="github-url"
          type="text"
          placeholder="URL du dépôt GitHub (ex. https://github.com/user/repo)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 placeholder-gray-400"
        />
        <span className="absolute left-3 top-12 transform -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.135 1.838 1.24 1.838 1.24 1.065 1.885 2.876 1.34 3.578 1.025.112-.795.434-1.34.792-1.645-2.776-.315-5.686-1.385-5.686-6.165 0-1.365.487-2.48 1.287-3.355-.13-.315-.558-1.585.123-3.305 0 0 1.05-.335 3.44 1.285A12.01 12.01 0 0112 4.8c1.065.005 2.135.145 3.14.43 2.39-1.62 3.435-1.285 3.435-1.285.685 1.72.255 2.99.125 3.305.805.875 1.285 1.99 1.285 3.355 0 4.795-2.915 5.845-5.695 6.155.445.385.84 1.145.84 2.31 0 1.665-.015 3.015-.015 3.42 0 .32.215.695.825.575C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </span>
      </div>
      <button
        onClick={checkCompliance}
        disabled={isLoading || !url}
        className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
          isLoading || !url ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5" />
            Vérifier
          </>
        )}
      </button>
    </div>
  );
};

const CodeComplianceChecker = ({ setResult, isLoading, setIsLoading }) => {
  const [codeInput, setCodeInput] = useState("");
  const [framework, setFramework] = useState("terraform");

  const checkCompliance = async () => {
    if (!codeInput.trim()) {
      toast.warn("Veuillez entrer du code à vérifier !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/api/checkov", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: codeInput, framework }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la vérification");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Vérification terminée avec succès !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.message || "Erreur lors de la vérification !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
        <CheckCircleIcon className="h-7 w-7 text-green-400" />
        Validation et Conformité - Code (Terraform, Kubernetes, Dockerfile)
      </h2>

      {/* 🔘 Sélecteur de framework */}
      <div className="mb-6">
        <label htmlFor="framework" className="text-gray-400 text-sm mb-2 block">
          Type de code :
        </label>
        <select
          id="framework"
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-lg p-3"
        >
          <option value="terraform">Terraform (.tf)</option>
          <option value="kubernetes">Kubernetes (.yaml)</option>
          <option value="dockerfile">Dockerfile</option>
        </select>
      </div>

      {/* 📥 Zone de saisie de code */}
      <div className="mb-6">
        <label htmlFor="code-input" className="text-gray-400 text-sm mb-2 block">
          Entrer le code :
        </label>
        <textarea
          id="code-input"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="w-full h-32 p-4 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 transition-all duration-200 font-mono"
          placeholder="Entrez le contenu du fichier ici..."
        />
      </div>

      <button
        onClick={checkCompliance}
        disabled={isLoading || !codeInput.trim()}
        className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
          isLoading || !codeInput.trim() ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5" />
            Vérifier
          </>
        )}
      </button>
    </div>
  );
};

const FileComplianceChecker = ({ setResult, isLoading, setIsLoading }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const checkCompliance = async () => {
    if (!file) {
      toast.warn("Veuillez sélectionner un fichier ou dossier ZIP à vérifier !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:5000/api/checkov", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la vérification");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Vérification terminée avec succès !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error(error.message || "Erreur lors de la vérification !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
        <CheckCircleIcon className="h-7 w-7 text-green-400" />
        Validation et Conformité - Fichier ou ZIP (NIST, ISO 27001, GDPR, HIPAA)
      </h2>
      <div className="mb-6">
        <label htmlFor="file-upload" className="text-gray-400 text-sm mb-2 block">
          Sélectionner un fichier ou dossier ZIP :
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".zip,.txt,.json,.yml,.yaml"
          onChange={handleFileChange}
          className="w-full text-gray-100 bg-gray-700 border border-gray-600 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
        />
      </div>
      <button
        onClick={checkCompliance}
        disabled={isLoading || !file}
        className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
          isLoading || !file ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-5 w-5" />
            Vérifier
          </>
        )}
      </button>
    </div>
  );
};

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  return (
    <div className="mt-6 w-full max-w-2xl">
      <label htmlFor="compliance-result" className="text-gray-400 text-sm mb-2 block">
        Résultat de la vérification :
      </label>
      <pre
        id="compliance-result"
        className="p-4 bg-gray-950 text-green-300 rounded-lg shadow-inner max-h-96 overflow-y-auto font-mono text-sm"
      >
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
};

const ComplianceChecker = () => {
  const [sourceType, setSourceType] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {sourceType === "github" && (
              <GitHubComplianceChecker setResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {sourceType === "code" && (
              <CodeComplianceChecker setResult={setResult} isLoading={isLoading} setIsLoading={setIsLoading} />
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
                onClick={() => setResult(null)} // Optional: Clear result without resetting source
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