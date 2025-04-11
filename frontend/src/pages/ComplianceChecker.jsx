import React, { useState } from "react";
import { toast } from "react-toastify";
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

const ComplianceChecker = () => {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [framework, setFramework] = useState("NIST");

  const frameworks = ["NIST", "ISO 27001", "GDPR", "HIPAA"];

  const checkCompliance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/compliance-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework }),
      });

      const data = await response.json();
      setResult(data);
      toast.success("Vérification terminée avec succès !", {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    } catch (error) {
      toast.error("Erreur lors de la vérification !", {
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
          <CheckCircleIcon className="h-7 w-7 text-green-400" />
          Validation et Conformité
        </h2>

        <div className="mb-6">
          <label htmlFor="framework-select" className="text-gray-400 text-sm mb-2 block">
            Cadre de conformité :
          </label>
          <select
            id="framework-select"
            value={framework}
            onChange={(e) => setFramework(e.target.value)}
            className="w-full p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
          >
            {frameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={checkCompliance}
          disabled={isLoading}
          className={`w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
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

        {result && (
          <div className="mt-6">
            <label htmlFor="compliance-result" className="text-gray-400 text-sm mb-2 block">
              Résultat de la vérification :
            </label>
            <pre
              id="compliance-result"
              className="p-4 bg-gray-950 text-green-300 rounded-lg shadow-inner max-h-96 overflow-auto font-mono text-sm"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceChecker;