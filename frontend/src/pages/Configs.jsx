import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { DocumentTextIcon, ArrowPathIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate } from "react-router-dom";

const Configs = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("http://127.0.0.1:5000/github/repo-configs", {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Échec récupération configurations");
        }

        const data = await response.json();
        setConfigs(data);
        toast.success("Configurations chargées !", {
          toastId: 'configurations-charged',
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      } catch (err) {
        setError("Impossible de charger les configurations");
        console.error("Erreur configs:", err);
        toast.error(err.message, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success("Contenu copié !", { position: "top-right", autoClose: 2000, theme: "dark" });
    });
  };

  const checkSingleFileCompliance = (config) => {
    const selectedFile = {
      id: config.id,
      file_name: config.file_name,
      content: config.content,
      framework: inferFramework(config.file_name),
    };

    navigate("/compliance", { state: { selectedFiles: [selectedFile] } });
  };

  const inferFramework = (fileName) => {
    const lowerName = fileName.toLowerCase();
    if (lowerName === "dockerfile") return "dockerfile";
    if (lowerName.endsWith(".yml") || lowerName.endsWith(".yaml")) return "kubernetes";
    if (lowerName.endsWith(".tf")) return "terraform";
    return "unknown";
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-3xl font-bold text-gray-100 mb-8 flex items-center gap-2">
        <DocumentTextIcon className="h-8 w-8 text-blue-400" />
        Configurations des Dépôts
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <ArrowPathIcon className="h-10 w-10 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-400">Chargement des configurations...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center py-10 text-red-400">
          <ArrowPathIcon className="h-6 w-6 mr-2" />
          <p>{error}</p>
        </div>
      ) : configs.length > 0 ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-4xl mx-auto">
          <ul className="space-y-4">
            {configs.map((config) => (
              <li key={config.id} className="border-b border-gray-700 pb-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <div className="overflow-hidden">
                      <a
                        href={config.repo_html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-100 hover:text-blue-400 transition-colors truncate block"
                      >
                        {config.repo_full_name}
                      </a>
                      <p className="text-gray-400 truncate">{config.file_path}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 min-w-fit">
                    <button
                      onClick={() => copyToClipboard(config.content)}
                      className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => checkSingleFileCompliance(config)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Check conformité
                    </button>
                    <Link
                      to="/generate-policy"
                      state={{ selectedFiles: [{ id: config.id, file_name: config.file_name, content: config.content, framework: inferFramework(config.file_name) }] }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Corriger
                    </Link>
                  </div>
                </div>
                <pre className="mt-2 p-4 bg-gray-900 text-gray-300 rounded-lg max-h-64 overflow-auto font-mono text-sm">
                  {config.content}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-400">Aucune configuration trouvée. Sélectionnez des dépôts dans le tableau de bord.</p>
      )}
    </div>
  );
};

export default Configs;