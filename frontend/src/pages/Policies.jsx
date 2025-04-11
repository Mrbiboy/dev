import React from "react";

const policies = [
  { id: 1, name: "IAM Policy AWS", status: "Validée", date: "2024-02-28" },
  { id: 2, name: "Sécurité Kubernetes", status: "En attente", date: "2024-02-27" },
];

const Policies = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestion des Politiques de Sécurité</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nom</th>
            <th className="border p-2">Statut</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id} className="hover:bg-gray-100">
              <td className="border p-2">{policy.name}</td>
              <td className="border p-2">{policy.status}</td>
              <td className="border p-2">{policy.date}</td>
              <td className="border p-2">
                <button className="bg-blue-500 text-white p-1 rounded hover:bg-blue-700">Voir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Policies;
