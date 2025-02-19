// src/pages/Integration.js
import React from 'react';
import { Container, Card, Table } from 'react-bootstrap';

const Integration = () => {
  const integrations = [
    { id: 1, name: 'Jenkins', status: 'Actif' },
    { id: 2, name: 'GitLab CI', status: 'Inactif' },
    { id: 3, name: 'GitHub Actions', status: 'Actif' },
  ];

  return (
    <Container>
      <h1 className="my-4">Intégration DevOps</h1>
      <Card>
        <Card.Body>
          <Card.Title>Statut des Intégrations</Card.Title>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.id}>
                  <td>{integration.id}</td>
                  <td>{integration.name}</td>
                  <td>{integration.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Integration;