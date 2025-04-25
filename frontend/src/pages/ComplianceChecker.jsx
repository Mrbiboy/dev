import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircleIcon, ArrowPathIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
// import GitHubComplianceChecker from "./GitHubComplianceChecker";
// import SelectedReposComplianceChecker from "./SelectedReposComplianceChecker";
// import CodeComplianceChecker from "./CodeComplianceChecker";
// import FileComplianceChecker from "./FileComplianceChecker";
// import ResultDisplay from "./ResultDisplay";

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
      const response = await fetch("http://127.0.0.1:5000/checkov", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ repo_url: url, input_type: "repo" }),
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

const SelectedReposComplianceChecker = ({ setResult, isLoading, setIsLoading }) => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState("");

  useEffect(() => {
    const fetchRepos = async () => {
      setReposLoading(true);
      setReposError("");
      try {
        const response = await fetch("http://127.0.0.1:5000/github/repos", {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Échec récupération dépôts");
        }

        const data = await response.json();
        const selectedRepos = data.filter(repo => repo.is_selected);
        setRepos(selectedRepos);
        if (selectedRepos.length > 0) {
          setSelectedRepo(selectedRepos[0].full_name); // Auto-select the first repo
        }
        toast.success("Dépôts sélectionnés chargés !", {
          toastId: "selectionned-repos-loaded",
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      } catch (err) {
        setReposError("Impossible de charger les dépôts GitHub");
        toast.error(err.message, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      } finally {
        setReposLoading(false);
      }
    };

    fetchRepos();
  }, []);

  const checkCompliance = async () => {
    if (!selectedRepo) {
      toast.warn("Veuillez sélectionner un dépôt !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }

    setIsLoading(true);
    try {
      const repoData = repos.find(r => r.full_name === selectedRepo);
      const response = await fetch("http://127.0.0.1:5000/checkov", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ repo_url: repoData.html_url, input_type: "repo" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la vérification");
      }

      const data = await response.json();
      setResult({ repo: repoData.full_name, data });
      toast.success("Vérification terminée !", {
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
        Validation et Conformité - Dépôts Sélectionnés
      </h2>
      {reposLoading ? (
        <div className="flex justify-center items-center py-4">
          <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-400">Chargement des dépôts...</span>
        </div>
      ) : reposError ? (
        <div className="flex justify-center items-center py-4 text-red-400">
          <p>{reposError}</p>
        </div>
      ) : repos.length > 0 ? (
        <div>
          <div className="mb-6">
            <label htmlFor="repo-select" className="text-gray-400 text-sm mb-2 block">
              Sélectionner un dépôt :
            </label>
            <select
              id="repo-select"
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full bg-gray-700 text-gray-100 border border-gray-600 rounded-lg p-3"
            >
              <option value="">Choisir un dépôt</option>
              {repos.map((repo) => (
                <option key={repo.full_name} value={repo.full_name}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={checkCompliance}
            disabled={isLoading || !selectedRepo}
            className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
              isLoading || !selectedRepo ? "opacity-50 cursor-not-allowed" : ""
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
      ) : (
        <p className="text-gray-400">Aucun dépôt sélectionné. Veuillez sélectionner des dépôts dans le tableau de bord.</p>
      )}
    </div>
  );
};

// CodeComplianceChecker.jsx

const CodeComplianceChecker = ({ setResult, isLoading, setIsLoading, preSelectedFiles = [] }) => {
  const [codeInput, setCodeInput] = useState("");
  const [framework, setFramework] = useState("terraform");

  // Populate textarea with the single pre-selected file
  useEffect(() => {
    if (preSelectedFiles.length === 1) {
      const file = preSelectedFiles[0];
      setCodeInput(file.content);
      setFramework(file.framework !== "unknown" ? file.framework : "terraform");
    }
  }, [preSelectedFiles]);

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
      const response = await fetch("http://127.0.0.1:5000/checkov", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
      {preSelectedFiles.length === 1 && (
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">
            Fichier sélectionné : {preSelectedFiles[0].file_name}
          </label>
        </div>
      )}
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
      <div className="mb-6">
        <label htmlFor="code-input" className="text-gray-400 text-sm mb-2 block">
          Contenu du fichier :
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
        className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-webkit-transition-colors duration-200 flex items-center justify-center gap-2 ${
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
      formData.append("input_type", file.name.endsWith(".zip") ? "zip" : "file");

      const response = await fetch("http://127.0.0.1:5000/checkov", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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
          accept=".zip,.txt,.json,.yml,.yaml,.tf,Dockerfile"
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

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      toast.success("Résultats copiés !", { position: "top-right", autoClose: 2000, theme: "dark" });
    });
  };

  const renderResults = (results) => {
    if (Array.isArray(results)) {
      return results.map((item, index) => (
        <div key={index} className="mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{item.repo}</h3>
          {item.error ? (
            <p className="text-red-400">Erreur : {item.error}</p>
          ) : (
            renderSingleResult(item.data)
          )}
        </div>
      ));
    }
    return renderSingleResult(results);
  };

  const renderSingleResult = (data) => {
    // Handle single file result
    if (data.file_path) {
      return (
        <div>
          <p className="text-gray-100">Fichier : {data.file_path}</p>
          <p className="text-green-400">Vérifications réussies : {data.passed_checks?.length || 0}</p>
          <p className="text-red-400">Vérifications échouées : {data.failed_checks?.length || 0}</p>
          {data.failed_checks?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-100 font-semibold">Vérifications échouées :</h4>
              <ul className="list-disc list-inside text-gray-300">
                {data.failed_checks.map((check, idx) => (
                  <li key={idx}>
                    <span className="text-red-400">{check.check_id}</span> - {check.check_name} (Fichier : {check.file_path}, Ligne : {check.file_line_range?.join("-")})
                    {check.guideline && <span>, Guideline: {check.guideline}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.passed_checks?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-gray-100 font-semibold">Vérifications réussies :</h4>
              <ul className="list-disc list-inside text-gray-300">
                {data.passed_checks.map((check, idx) => (
                  <li key={idx}>
                    <span className="text-green-400">{check.check_id}</span> - {check.check_name} (Fichier : {check.file_path}, Ligne : {check.file_line_range?.join("-")})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Handle directory/repo result
    const results = data.results || data;
    if (!results.status) {
      return <p className="text-gray-400">Aucun résultat disponible.</p>;
    }

    return (
      <div>
        <div className="mb-4">
          <p className="text-green-400">Vérifications réussies : {results.summary?.passed || results.passed_checks?.length || 0}</p>
          <p className="text-red-400">Vérifications échouées : {results.summary?.failed || results.failed_checks?.length || 0}</p>
          <p className="text-gray-100">Score : {results.score}%</p>
          <p className="text-gray-100">Conforme : {results.compliant ? "Oui" : "Non"}</p>
        </div>
        {results.failed_checks?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-gray-100 font-semibold">Vérifications échouées :</h4>
            <ul className="list-disc list-inside text-gray-300">
              {results.failed_checks.map((check, idx) => (
                <li key={idx}>
                  <span className="text-red-400">{check.check_id}</span> - {check.check_name} (Fichier : {check.file_path}, Ligne : {check.file_line_range?.join("-")})
                  {check.guideline && <span>, Guideline: {check.guideline}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {results.passed_checks?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-gray-100 font-semibold">Vérifications réussies :</h4>
            <ul className="list-disc list-inside text-gray-300">
              {results.passed_checks.map((check, idx) => (
                <li key={idx}>
                  <span className="text-green-400">{check.check_id}</span> - {check.check_name} (Fichier : {check.file_path}, Ligne : {check.file_line_range?.join("-")})
                </li>
              ))}
            </ul>
          </div>
        )}
        {results.files_found?.length > 0 && (
          <div>
            <h4 className="text-gray-100 font-semibold">Fichiers scannés :</h4>
            <ul className="list-disc list-inside text-gray-300">
              {results.files_found.map((file, idx) => (
                <li key={idx}>{file}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6 w-full max-w-2xl relative">
      <label htmlFor="compliance-result" className="text-gray-400 text-sm mb-2 block">
        Résultat de la vérification :
      </label>
      <div className="p-4 bg-gray-950 text-green-300 rounded-lg shadow-inner max-h-96 overflow-y-auto font-mono text-sm">
        {renderResults(result)}
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// ComplianceChecker.jsx


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
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385..." />
                </svg>
                Dépôts Sélectionnés
              </button>
              <button
                onClick={() => setSourceType("github")}
                className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385..." />
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