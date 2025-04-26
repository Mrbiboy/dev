import React from "react";
import { toast } from "react-toastify";
import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      toast.success("Résultats copiés !", { position: "top-right", autoClose: 2000, theme: "dark" });
    });
  };

  const renderResults = (results) => {
    // Handle array of results (legacy support for multi-repo)
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

    // Handle single result from SelectedReposComplianceChecker
    if (results.repo && results.data) {
      return (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{results.repo}</h3>
          {renderSingleResult(results.data)}
        </div>
      );
    }

    // Handle raw Checkov result (from GitHubComplianceChecker, CodeComplianceChecker, etc.)
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
    if (!results.passed_checks && !results.failed_checks && !results.summary) {
      return <p className="text-gray-400">Aucun résultat disponible.</p>;
    }

    return (
      <div>
        <div className="mb-4">
          <p className="text-green-400">Vérifications réussies : {results.summary?.passed || results.passed_checks?.length || 0}</p>
          <p className="text-red-400">Vérifications échouées : {results.summary?.failed || results.failed_checks?.length || 0}</p>
          {results.summary?.resource_count !== undefined && (
            <p className="text-gray-100">Ressources scannées : {results.summary.resource_count}</p>
          )}
          {results.score !== undefined && <p className="text-gray-100">Score : {results.score}%</p>}
          {results.compliant !== undefined && (
            <p className="text-gray-100">Conforme : {results.compliant ? "Oui" : "Non"}</p>
          )}
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

export default ResultDisplay;