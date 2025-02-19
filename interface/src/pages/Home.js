import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Card } from 'react-bootstrap';

const Home = () => {
  const [formData, setFormData] = useState({
    githubLink: '',
    infrastructureType: 'Kubernetes',
    complianceStandards: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prevState) => ({
        ...prevState,
        complianceStandards: checked
          ? [...prevState.complianceStandards, value]
          : prevState.complianceStandards.filter((item) => item !== value),
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form Data Submitted:', formData);
  };

  return (
    <Container className="mt-4">
      <h1>Bienvenue sur le Security Policy Dashboard</h1>
      <p>Visualisez et gérez les politiques de sécurité de vos pipelines DevOps.</p>

      {/* Présentation du projet */}
      <Row className="my-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Automatisation de la sécurité</Card.Title>
              <Card.Text>
                Génération automatique de politiques de sécurité conformes aux bonnes pratiques.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Validation et conformité</Card.Title>
              <Card.Text>
                Validation des configurations selon les standards GDPR, NIST et autres normes.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Surveillance et alertes</Card.Title>
              <Card.Text>
                Monitoring en temps réel des configurations et alerte sur les vulnérabilités.
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Compatibilité DevOps</Card.Title>
              <Card.Text>
                Intégration avec Kubernetes, AWS, Terraform et les pipelines CI/CD.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Formulaire de configuration */}
      <h2>Configuration de votre projet</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="githubLink" className="mb-3">
          <Form.Label>Lien GitHub du projet</Form.Label>
          <Form.Control
            type="url"
            placeholder="https://github.com/username/repository"
            name="githubLink"
            value={formData.githubLink}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="infrastructureType" className="mb-3">
          <Form.Label>Type d'infrastructure</Form.Label>
          <Form.Select name="infrastructureType" value={formData.infrastructureType} onChange={handleChange}>
            <option value="Kubernetes">Kubernetes</option>
            <option value="Docker">Docker</option>
            <option value="Terraform">Terraform</option>
            <option value="AWS IAM">AWS IAM</option>
          </Form.Select>
        </Form.Group>

        <Form.Group controlId="complianceStandards" className="mb-3">
          <Form.Label>Normes de conformité</Form.Label>
          <div>
            <Form.Check
              type="checkbox"
              label="GDPR"
              value="GDPR"
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              label="NIST"
              value="NIST"
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              label="ISO 27001"
              value="ISO 27001"
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              label="SOC 2"
              value="SOC 2"
              onChange={handleChange}
            />
          </div>
        </Form.Group>

        <Button variant="primary" type="submit">Soumettre</Button>
      </Form>
    </Container>
  );
};

export default Home;
