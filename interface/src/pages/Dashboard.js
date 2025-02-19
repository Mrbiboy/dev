// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPolicies } from '../Services/api';

const Dashboard = () => {
    console.log('Dashboard');
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPolicies();
      setPolicies(data);
    };
    fetchData();
  }, []);

  const data = [
    { name: 'Politique 1', vulnérabilités: 5, conformité: 90 },
    { name: 'Politique 2', vulnérabilités: 2, conformité: 95 },
    { name: 'Politique 3', vulnérabilités: 8, conformité: 85 },
  ];

  return (
    <Container>
      <h1 className="my-4">Tableau de Bord des Politiques de Sécurité</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Statistiques des Politiques</Card.Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="vulnérabilités" fill="#8884d8" />
                  <Bar dataKey="conformité" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <Card.Title>Liste des Politiques</Card.Title>
              <ul>
                {policies.map((policy) => (
                  <li key={policy.id}>{policy.name} - {policy.status}</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;