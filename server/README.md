# Backend - Plateforme Intelligente d'Intégration des Étudiants Internationaux

## 📋 Description

Ce backend constitue l'API RESTful pour la plateforme d'intégration des étudiants internationaux basée sur l'IA. Il gère l'authentification, les profils utilisateurs, le système de matching intelligent, la messagerie en temps réel, l'assistant IA et les recommandations d'activités.

## 🏗️ Architecture

- **Node.js** + **Express.js** - Framework serveur
- **Firebase Firestore** - Base de données NoSQL
- **Socket.io** - Communication temps réel
- **JWT** + **bcrypt** - Authentification sécurisée
- **OpenAI API** - Assistant IA conversationnel
- **Google Translate API** - Traduction automatique

## 🚀 Fonctionnalités Implémentées

### ✅ Authentification Sécurisée
- Inscription et connexion des utilisateurs
- Hashage des mots de passe avec bcrypt
- Tokens JWT avec expiration
- Validation des entrées utilisateur

### ✅ Gestion des Profils Étudiants
- Création et mise à jour des profils
- Champs : nom, nationalité, langue, centres d'intérêt, filière, bio, avatar
- Rôles : étudiant, mentor
- Profils publics et privés

### ✅ Système de Matching Intelligent
- Algorithme de score de compatibilité (0-100)
- Critères : intérêts communs (40pts), langue (20pts), pays (20pts), filière (20pts)
- Suggestions de profils compatibles
- Filtrage des mentors disponibles

### ✅ Assistant IA Conversationnel
- Intégration OpenAI GPT-4o-mini
- Context maintenu avec l'historique des messages
- Réponses personnalisées pour étudiants internationaux
- Aide administrative, vie pratique, intégration sociale

### ✅ Messagerie Temps Réel
- Conversations privées entre utilisateurs
- Socket.io pour communication instantanée
- Historique des messages avec pagination
- Indicateurs de frappe en temps réel

### ✅ Traduction Automatique
- Détection automatique de langue
- Traduction via Google Translate API
- Support multilingue pour les messages

### ✅ Recommandations d'Activités
- Système de recommandation basé sur les intérêts
- Événements, clubs, activités étudiantes
- Score de pertinence personnalisé
- Inscription et désinscription aux activités

### ✅ Sécurité Avancée
- Rate limiting par endpoint
- Validation et nettoyage des entrées
- Protection contre les injections XSS
- Limitation des requêtes malveillantes

## 📁 Structure du Projet

```
server/
├── controllers/          # Logique métier
│   ├── authController.js
│   ├── userController.js
│   ├── matchController.js
│   ├── messageController.js
│   ├── aiController.js
│   └── activityController.js
├── routes/              # Définition des routes API
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── matchRoutes.js
│   ├── messageRoutes.js
│   ├── aiRoutes.js
│   └── activityRoutes.js
├── middleware/          # Middleware Express
│   ├── authMiddleware.js
│   ├── rateLimit.js
│   └── validation.js
├── firebase/           # Configuration Firebase
│   └── index.js
├── sockets/           # Gestion Socket.io
├── app.js            # Configuration Express
├── server.js         # Démarrage serveur
├── package.json      # Dépendances
└── .env.example      # Variables d'environnement
```

## 🔧 Installation

1. **Cloner le dépôt**
   ```bash
   git clone <repository-url>
   cd backend/server
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos clés API
   ```

4. **Configurer Firebase**
   - Créer un projet Firebase
   - Générer une clé de service compte
   - Placer `firebaseConfig.json` dans le dossier `firebase/`

5. **Démarrer le serveur**
   ```bash
   # Développement
   npm run dev
   
   # Production
   npm start
   ```

## 🔑 Variables d'Environnement

```env
PORT=5000
JWT_SECRET=your_very_secret_key_here_change_this_in_production
OPENAI_API_KEY=sk-your-openai-api-key-here
GOOGLE_TRANSLATE_API_KEY=AIza-your-google-translate-api-key-here
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
CORS_ORIGIN=http://localhost:3000
```

## 🛡️ Sécurité Avancée

### Protection HTTP
- **Helmet.js** : Protection contre les vulnérabilités web courantes
- **CORS configuré** : Contrôle d'accès cross-origin
- **Rate limiting** : Protection contre les attaques par force brute

### Rate Limiting
- **Général** : 100 requêtes/15 minutes
- **Authentification** : 5 tentatives/15 minutes  
- **IA** : 10 requêtes/minute
- **Messages** : 30 messages/minute

### Validation et Nettoyage des Entrées
- **XSS Protection** : Nettoyage avec `xss` library
- **Validator.js** : Validation robuste des formats
- **Échappement HTML** : Protection contre les injections
- **Validation URLs** : Vérification des liens et avatars
- **Complexité mots de passe** : Exigences de sécurité renforcées

### Authentification Sécurisée
- Tokens JWT avec expiration 7 jours
- Mots de passe hashés avec bcrypt (salt 10)
- Vérification systématique de l'authentification
- **Socket.io sécurisé** : Authentification pour les connexions temps réel

### Sécurité IA
- **Service de sécurité IA dédié** : Validation des messages avant envoi à OpenAI
- **Détection de contenu dangereux** : Patterns d'injection de code
- **Limitation taille messages** : Protection contre les abus
- **Nettoyage automatique** : XSS et caractères dangereux

### Gestion des Erreurs
- **Middleware d'erreur centralisé** : Logging structuré
- **Environnement adapté** : Stack trace uniquement en développement
- **Réponses cohérentes** : Format d'erreur standardisé

## 📊 Endpoints API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Utilisateurs  
- `GET /api/users/me` - Profil utilisateur
- `PUT /api/users/me` - Mettre à jour profil
- `GET /api/users/:id` - Profil public

### Matching
- `GET /api/match/suggestions` - Suggestions de profils
- `GET /api/match/mentors` - Mentors disponibles

### Messagerie
- `GET /api/messages/conversations` - Liste conversations
- `POST /api/messages/conversations` - Créer conversation
- `GET /api/messages/conversations/:id` - Messages conversation
- `POST /api/messages/conversations/:id` - Envoyer message

### IA
- `POST /api/ai/chat` - Discussion avec assistant
- `POST /api/ai/translate` - Traduire texte
- `POST /api/ai/detect-language` - Détecter langue

### Activités
- `GET /api/activities/recommendations` - Recommandations personnalisées
- `GET /api/activities` - Liste activités
- `GET /api/activities/:id` - Détails activité
- `POST /api/activities/:id/join` - Rejoindre activité
- `POST /api/activities/:id/leave` - Quitter activité

## 🔄 Socket.io Events

### Client → Serveur
- `joinRoom` - Rejoindre conversation
- `leaveRoom` - Quitter conversation  
- `sendMessage` - Envoyer message
- `typing` - Indicateur frappe
- `stopTyping` - Arrêter frappe

### Serveur → Client
- `receiveMessage` - Nouveau message reçu
- `typing` - Utilisateur en train d'écrire
- `stopTyping` - Utilisateur a arrêté d'écrire
- `messageError` - Erreur envoi message

## 🧪 Tests

Pour tester l'API :

```bash
# Tests avec curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

## 📝 Notes de Développement

- Le backend est 100% conforme au cahier des charges
- Architecture modulaire et extensible
- Documentation complète des endpoints
- Gestion d'erreurs centralisée
- Logs structurés pour le debugging

## 🚀 Déploiement

### Production
1. Configurer toutes les variables d'environnement
2. Utiliser `npm start` pour le démarrage
3. Configurer un reverse proxy (nginx)
4. Mettre en place HTTPS
5. Configurer monitoring et logs

### Docker (optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📞 Support

Pour toute question ou problème :
- Consulter la documentation des endpoints
- Vérifier les logs du serveur
- Valider la configuration des variables d'environnement
