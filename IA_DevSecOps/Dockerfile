# Utilisation d'une image sans version spécifique (non conforme)
FROM python:latest

# Mauvais format pour le mainteneur (LABEL non utilisé)
MAINTAINER John Doe <johndoe[at]example.com>

# Ajout de variables d'environnement contenant des secrets (non conforme)
ENV DB_PASSWORD=mysecretpassword
ENV API_KEY=123456789abcdef

# Installation des dépendances sans mise à jour de la liste des paquets (non conforme)
RUN apt-get install -y python3-pip

# Mauvaise pratique : utilisation de ADD au lieu de COPY
ADD app /app

# Travail en tant qu'utilisateur root (non conforme)
USER root

# Exposition de ports sensibles (non conforme)
EXPOSE 22 3306 8080

# Mauvaise gestion du cache après installation des paquets (non conforme)
RUN apt-get install -y curl vim \
    && echo "Installation terminée"

# Exécution du conteneur avec une mauvaise commande CMD
CMD ["python", "-m", "app.py"]
