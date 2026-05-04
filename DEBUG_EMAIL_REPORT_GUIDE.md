# Guide de Débogage - Envoi de Rapport Email

## 🔍 Console.log Ajoutés

### Backend - Controller (`materials.controller.ts`)

```
🔵 [DAILY REPORT] Début de la requête
🔵 [DAILY REPORT] Body reçu: {...}
🔴 [DAILY REPORT] Email manquant dans le body (si erreur)
🔴 [DAILY REPORT] Format email invalide: ... (si erreur)
🟢 [DAILY REPORT] Email valide: ...
🔵 [DAILY REPORT] Appel du service sendManualReport...
🔵 [DAILY REPORT] Résultat du service: {...}
🟢 [DAILY REPORT] Succès: ... (si succès)
🔴 [DAILY REPORT] Échec: ... (si échec)
🔴 [DAILY REPORT] Exception capturée: ... (si exception)
```

### Backend - Service (`daily-report.service.ts`)

```
🔵 [DAILY REPORT SERVICE] sendManualReport appelé
🔵 [DAILY REPORT SERVICE] Email: ...
🔵 [DAILY REPORT SERVICE] Email final: ...
🔴 [DAILY REPORT SERVICE] Aucun email spécifié (si erreur)
🔵 [DAILY REPORT SERVICE] Génération des données du rapport...
🟢 [DAILY REPORT SERVICE] Données générées avec succès
🔵 [DAILY REPORT SERVICE] Statistiques: {...}
🔵 [DAILY REPORT SERVICE] Envoi de l'email...
🟢 [DAILY REPORT SERVICE] Email envoyé avec succès
🔴 [DAILY REPORT SERVICE] Erreur capturée: ... (si erreur)
```

### Backend - Email (`daily-report.service.ts` - sendDailyReportEmail)

```
🔵 [EMAIL] sendDailyReportEmail appelé
🔵 [EMAIL] Destinataire: ...
🔵 [EMAIL] Sujet: ...
🔵 [EMAIL] Import de nodemailer...
🟢 [EMAIL] Nodemailer importé avec succès
🔵 [EMAIL] Configuration SMTP:
  - Host: ...
  - Port: ...
  - User: ...
  - Pass: ***xxxx
🔴 [EMAIL] Configuration SMTP incomplète! (si erreur)
🔵 [EMAIL] Création du transporteur...
🟢 [EMAIL] Transporteur créé avec succès
🔵 [EMAIL] Vérification de la connexion SMTP...
🟢 [EMAIL] Connexion SMTP vérifiée avec succès
🔵 [EMAIL] Envoi de l'email...
  - From: ...
  - To: ...
🟢 [EMAIL] Email envoyé avec succès!
🔵 [EMAIL] Message ID: ...
🔵 [EMAIL] Response: ...
🔵 [EMAIL] URL Ethereal: ... (si Ethereal)
🔴 [EMAIL] Erreur lors de l'envoi: ... (si erreur)
```

### Frontend (`DailyReportButton.tsx`)

```
🔵 [FRONTEND] handleGenerateReport appelé
🔵 [FRONTEND] Email saisi: ...
🔴 [FRONTEND] Email invalide (si erreur)
🟢 [FRONTEND] Email valide
🔵 [FRONTEND] Envoi de la requête POST...
🔵 [FRONTEND] URL: /api/materials/reports/daily/send
🔵 [FRONTEND] Body: {...}
🟢 [FRONTEND] Réponse reçue: {...}
🟢 [FRONTEND] Succès! (si succès)
🔴 [FRONTEND] Échec: ... (si échec)
🔴 [FRONTEND] Exception capturée: ... (si exception)
```

## 🎯 Comment Déboguer

### Étape 1: Ouvrir la Console du Navigateur

1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet "Console"
3. Filtrer par "FRONTEND" pour voir les logs frontend

### Étape 2: Ouvrir les Logs Backend

1. Ouvrir le terminal où tourne materials-service
2. Observer les logs en temps réel
3. Chercher les messages avec 🔵, 🟢, ou 🔴

### Étape 3: Tester l'Envoi

1. Cliquer sur "Generate AI Report"
2. Entrer un email (ex: `test@example.com`)
3. Cliquer "Generate & Send"
4. Observer les logs dans les deux consoles

## 📊 Scénarios de Débogage

### Scénario 1: Email Invalide

**Console Frontend**:
```
🔵 [FRONTEND] handleGenerateReport appelé
🔵 [FRONTEND] Email saisi: test
🔴 [FRONTEND] Email invalide
```

**Toast**: "Please enter a valid email address"

**Solution**: Entrer un email valide (ex: `test@example.com`)

---

### Scénario 2: Service Backend Non Démarré

**Console Frontend**:
```
🔵 [FRONTEND] handleGenerateReport appelé
🔵 [FRONTEND] Email saisi: test@example.com
🟢 [FRONTEND] Email valide
🔵 [FRONTEND] Envoi de la requête POST...
🔴 [FRONTEND] Exception capturée: Network Error
```

**Toast**: "❌ Failed to send report - Network Error"

**Solution**: Démarrer le service materials-service
```bash
cd apps/backend/materials-service
npm run start:dev
```

---

### Scénario 3: Configuration SMTP Manquante

**Console Backend**:
```
🔵 [DAILY REPORT] Début de la requête
🟢 [DAILY REPORT] Email valide: test@example.com
🔵 [EMAIL] Configuration SMTP:
  - Host: undefined
  - Port: undefined
  - User: undefined
  - Pass: NON DÉFINI
🔴 [EMAIL] Configuration SMTP incomplète!
```

**Toast**: "❌ Failed to send report - Configuration SMTP incomplète"

**Solution**: Vérifier le fichier `.env`
```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=jamar.wisoky@ethereal.email
SMTP_PASS=ppg5A4AUcaFHWFP3DY
```

---

### Scénario 4: Nodemailer Non Importé

**Console Backend**:
```
🔵 [EMAIL] Import de nodemailer...
🔴 [EMAIL] Erreur lors de l'envoi: nodemailer.createTransporter is not a function
```

**Toast**: "❌ Failed to send report - nodemailer.createTransporter is not a function"

**Solution**: Vérifier que nodemailer est installé
```bash
cd apps/backend/materials-service
npm install nodemailer
npm run start:dev
```

---

### Scénario 5: Succès Complet ✅

**Console Frontend**:
```
🔵 [FRONTEND] handleGenerateReport appelé
🔵 [FRONTEND] Email saisi: test@example.com
🟢 [FRONTEND] Email valide
🔵 [FRONTEND] Envoi de la requête POST...
🟢 [FRONTEND] Réponse reçue: { success: true, message: "..." }
🟢 [FRONTEND] Succès!
```

**Console Backend**:
```
🔵 [DAILY REPORT] Début de la requête
🟢 [DAILY REPORT] Email valide: test@example.com
🔵 [DAILY REPORT SERVICE] Génération des données du rapport...
🟢 [DAILY REPORT SERVICE] Données générées avec succès
🔵 [EMAIL] Création du transporteur...
🟢 [EMAIL] Transporteur créé avec succès
🔵 [EMAIL] Vérification de la connexion SMTP...
🟢 [EMAIL] Connexion SMTP vérifiée avec succès
🔵 [EMAIL] Envoi de l'email...
🟢 [EMAIL] Email envoyé avec succès!
🔵 [EMAIL] Message ID: <abc123@ethereal.email>
🔵 [EMAIL] URL Ethereal: https://ethereal.email/message/...
```

**Toast**: "✅ Report sent successfully to test@example.com"

**Vérification**: Aller sur https://ethereal.email/messages

## 🎨 Améliorations Frontend

### Pop-ups Améliorés

1. **Succès**:
   - Toast vert avec ✅
   - Message: "Report sent successfully to [email]"
   - Description: "Check your email inbox or Ethereal messages"
   - Durée: 5 secondes

2. **Erreur**:
   - Toast rouge avec ❌
   - Message: "Failed to send report"
   - Description: Message d'erreur détaillé
   - Durée: 7 secondes

### Information Ethereal

Ajout d'un encadré violet dans le dialog:
```
📬 Testing Mode (Ethereal Email)
Emails are captured by Ethereal. View them at: ethereal.email/messages
Login: jamar.wisoky@ethereal.email
```

## 📝 Checklist de Test

- [ ] Service materials-service démarré
- [ ] Console navigateur ouverte (F12)
- [ ] Terminal backend visible
- [ ] Email valide saisi
- [ ] Clic sur "Generate & Send"
- [ ] Logs frontend visibles dans console navigateur
- [ ] Logs backend visibles dans terminal
- [ ] Toast de succès/erreur affiché
- [ ] Email vérifié sur Ethereal (si succès)

## 🔗 Liens Utiles

- **Ethereal Messages**: https://ethereal.email/messages
- **Login Ethereal**: jamar.wisoky@ethereal.email / ppg5A4AUcaFHWFP3DY
- **Documentation**: `MATERIALS_EMAIL_CONFIG.md`
- **Fix Nodemailer**: `EMAIL_NODEMAILER_FIX.md`

## 🚀 Prochaines Étapes

1. Redémarrer le service materials-service
2. Tester l'envoi avec les nouveaux logs
3. Observer les logs dans les deux consoles
4. Identifier le problème exact
5. Appliquer la solution appropriée
6. Vérifier l'email sur Ethereal
