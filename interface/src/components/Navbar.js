// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import {Button, Navbar, Nav, Container } from 'react-bootstrap';

const CustomNavbar = () => {
    console.log('CustomNavbar');
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Security Policy Dashboard</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Accueil</Nav.Link>
            <Nav.Link as={Link} to="/dashboard">Tableau de Bord</Nav.Link>
            <Nav.Link as={Link} to="/integration">Intégration DevOps</Nav.Link>
          </Nav>
            {/* Boutons Sign In et Log In */}
            <Nav className="ms-auto">
                <Button as={Link} to="/signin" variant="outline-light" className="me-2">Sign Up</Button>
                <Button as={Link} to="/login" variant="light">Log In</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;