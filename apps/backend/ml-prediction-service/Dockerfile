# ========================================
# Dockerfile pour ML Prediction Service (Python)
# ========================================

# Utiliser une image Python légère
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier des dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le code source
COPY . .

# Exposer le port (par défaut 8000 pour FastAPI/Flask)
EXPOSE 8000

# Variable d'environnement pour Python
ENV PYTHONUNBUFFERED=1

# Commande pour démarrer le service
# Adapter selon ton framework (FastAPI, Flask, etc.)
CMD ["python", "main.py"]
