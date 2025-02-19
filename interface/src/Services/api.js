// src/services/api.js
export const getPolicies = async () => {
    // Simulez une réponse API
    return [
      { id: 1, name: 'Politique 1', status: 'Conforme' },
      { id: 2, name: 'Politique 2', status: 'Non conforme' },
      { id: 3, name: 'Politique 3', status: 'En attente' },
    ];
  };