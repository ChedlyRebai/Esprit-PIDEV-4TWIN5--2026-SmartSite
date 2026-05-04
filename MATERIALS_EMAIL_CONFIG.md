# Materials Service - Email Configuration

## ✅ Configuration Complète - Ethereal Email

### Compte Ethereal Créé
- **Nom**: Jamar Wisoky
- **Email**: jamar.wisoky@ethereal.email
- **Mot de passe**: ppg5A4AUcaFHWFP3DY
- **Hôte SMTP**: smtp.ethereal.email
- **Port SMTP**: 587
- **Sécurité**: STARTTLS

### Configuration dans `.env`

Le fichier `apps/backend/materials-service/.env` a été mis à jour avec:

```env
# Email Configuration for Anomaly Alerts (Ethereal Email for Testing)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=jamar.wisoky@ethereal.email
SMTP_PASS=ppg5A4AUcaFHWFP3DY
SMTP_FROM="SmartSite Materials <jamar.wisoky@ethereal.email>"
ADMIN_EMAIL=jamar.wisoky@ethereal.email
FRONTEND_LOGIN_URL=http://localhost:5173/login

# Legacy email variables (kept for backward compatibility)
EMAIL_USER=jamar.wisoky@ethereal.email
EMAIL_PASSWORD=ppg5A4AUcaFHWFP3DY
EMAIL_FROM="SmartSite Alerts <jamar.wisoky@ethereal.email>"

# Daily Report Configuration
DAILY_REPORT_CRON=0 7 * * *
DAILY_REPORT_EMAIL=jamar.wisoky@ethereal.email
DAILY_REPORT_ENABLED=true
```

## 📧 Services Email dans Materials Service

### 1. Daily Report Service
**Fichier**: `apps/backend/materials-service/src/materials/services/daily-report.service.ts`

**Fonctionnalités**:
- Envoi automatique de rapports quotidiens (7h du matin)
- Envoi manuel de rapports via API
- Rapport HTML complet avec statistiques

**Endpoint API**: `POST /api/materials/reports/daily/send`

**Utilise les variables**:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `DAILY_REPORT_EMAIL`
- `DAILY_REPORT_ENABLED`

### 2. Anomaly Email Service
**Fichier**: `apps/backend/materials-service/src/common/email/anomaly-email.service.ts`

**Fonctionnalités**:
- Envoi d'alertes pour anomalies de stock
- Notifications de sorties/entrées excessives
- Alertes de stock critique

**Endpoint de test**: `POST /api/materials/email/test`

**Utilise les variables**:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER` (ou `EMAIL_USER`)
- `SMTP_PASS` (ou `EMAIL_PASSWORD`)
- `SMTP_FROM` (ou `EMAIL_FROM`)
- `ADMIN_EMAIL`
- `FRONTEND_LOGIN_URL`

## 🧪 Tests

### Test 1: Rapport Quotidien

1. **Via Frontend**:
   - Aller sur la page Materials
   - Cliquer sur "Generate AI Report"
   - Entrer l'email: `jamar.wisoky@ethereal.email`
   - Cliquer "Generate & Send"

2. **Via API directe**:
   ```bash
   curl -X POST http://localhost:3009/api/materials/reports/daily/send \
     -H "Content-Type: application/json" \
     -d '{"email":"jamar.wisoky@ethereal.email"}'
   ```

3. **Vérifier l'email**:
   - Aller sur https://ethereal.email/messages
   - Se connecter avec:
     - Username: `jamar.wisoky@ethereal.email`
     - Password: `ppg5A4AUcaFHWFP3DY`
   - Voir l'email avec le sujet: `[SmartSite] Rapport quotidien matériaux — [date]`

### Test 2: Alerte d'Anomalie

1. **Via API**:
   ```bash
   curl -X POST http://localhost:3009/api/materials/email/test \
     -H "Content-Type: application/json" \
     -d '{"email":"jamar.wisoky@ethereal.email","materialName":"Ciment Test"}'
   ```

2. **Vérifier l'email**:
   - Même procédure que Test 1
   - Email avec sujet: `🚨 Alerte Anomalie Stock - [Material Name]`

## 📊 Logs Backend à Vérifier

Lors de l'envoi d'un email, vous devriez voir dans les logs:

```
📊 Déclenchement manuel du rapport quotidien...
📧 Configuration SMTP: smtp.ethereal.email:587 (user: jamar.wisoky@ethereal.email)
✅ Connexion SMTP vérifiée avec succès
✅ Rapport quotidien envoyé à jamar.wisoky@ethereal.email
📬 Message ID: <message-id>
🔗 Prévisualisation Ethereal: https://ethereal.email/message/...
```

## 🔧 Dépannage

### Problème: "Configuration SMTP incomplète"
**Solution**: Vérifier que toutes les variables SMTP_* sont définies dans `.env`

### Problème: "SMTP connection failed"
**Solution**: 
- Vérifier les credentials Ethereal
- Vérifier la connectivité réseau
- Port 587 doit être ouvert

### Problème: "Email not received"
**Solution**:
- Vérifier les logs backend pour le Message ID
- Utiliser l'URL de prévisualisation Ethereal dans les logs
- Se connecter sur https://ethereal.email/messages

### Problème: "Invalid email format"
**Solution**: L'email doit suivre le format `user@domain.com`

## 🔐 Accès Ethereal Email

**URL**: https://ethereal.email/messages

**Credentials**:
- **Username**: jamar.wisoky@ethereal.email
- **Password**: ppg5A4AUcaFHWFP3DY

**Note**: Ethereal Email est un service de test. Les emails ne sont PAS réellement envoyés aux destinataires. Tous les emails sont capturés et visibles uniquement via l'interface web Ethereal.

## 📝 Configuration IMAP/POP3 (Optionnel)

Si vous voulez tester avec un client email (Thunderbird, Outlook, etc.):

### IMAP
- **Host**: imap.ethereal.email
- **Port**: 993
- **Security**: TLS
- **Username**: jamar.wisoky@ethereal.email
- **Password**: ppg5A4AUcaFHWFP3DY

### POP3
- **Host**: pop3.ethereal.email
- **Port**: 995
- **Security**: TLS
- **Username**: jamar.wisoky@ethereal.email
- **Password**: ppg5A4AUcaFHWFP3DY

## 🚀 Déploiement Production

Pour la production, remplacer Ethereal par un vrai service SMTP:

### Option 1: Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
SMTP_FROM="SmartSite <votre-email@gmail.com>"
```

### Option 2: SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-cle-api-sendgrid
SMTP_FROM="SmartSite <noreply@votredomaine.com>"
```

### Option 3: AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=votre-username-ses
SMTP_PASS=votre-password-ses
SMTP_FROM="SmartSite <noreply@votredomaine.com>"
```

## ✅ Checklist de Vérification

- [x] Variables SMTP configurées dans `.env`
- [x] Credentials Ethereal valides
- [x] Service nodemailer installé (`package.json`)
- [x] Import nodemailer dans `daily-report.service.ts`
- [x] Validation SMTP dans le code
- [x] Gestion d'erreurs améliorée
- [x] Logs détaillés activés
- [x] Frontend traduit en anglais
- [x] Validation email côté frontend et backend

## 📞 Support

En cas de problème:
1. Vérifier les logs backend
2. Tester la connexion SMTP avec l'endpoint `/api/materials/email/test`
3. Vérifier que le service materials-service est démarré
4. Vérifier la configuration `.env`
5. Créer un nouveau compte Ethereal si nécessaire: https://ethereal.email/create
