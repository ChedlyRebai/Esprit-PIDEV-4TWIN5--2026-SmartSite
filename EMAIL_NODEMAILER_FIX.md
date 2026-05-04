# Fix: nodemailer.createTransporter is not a function

## 🐛 Problème Identifié

Lors de l'envoi d'un rapport quotidien, l'erreur suivante se produisait:
```
"nodemailer.createTransporter is not a function"
```

## 🔍 Cause Racine

Le problème venait de l'import de nodemailer avec la syntaxe ES6:
```typescript
import * as nodemailer from 'nodemailer';
// ou
import nodemailer from 'nodemailer';
```

Avec la configuration TypeScript `module: "nodenext"`, cette syntaxe ne fonctionnait pas correctement avec nodemailer qui utilise CommonJS.

## ✅ Solution Appliquée

Utiliser `require()` pour importer nodemailer dynamiquement:

### Fichier 1: `daily-report.service.ts`

**Avant**:
```typescript
import nodemailer from 'nodemailer';

private async sendDailyReportEmail(...) {
  const transporter = nodemailer.createTransporter({...});
}
```

**Après**:
```typescript
// Pas d'import en haut du fichier

private async sendDailyReportEmail(...) {
  const nodemailer = require('nodemailer'); // Import dynamique
  const transporter = nodemailer.createTransporter({...});
}
```

### Fichier 2: `anomaly-email.service.ts`

**Avant**:
```typescript
import nodemailer from 'nodemailer';

constructor(private configService: ConfigService) {
  this.transporter = nodemailer.createTransport({...});
}
```

**Après**:
```typescript
import type nodemailer from 'nodemailer'; // Type uniquement

constructor(private configService: ConfigService) {
  const nodemailer = require('nodemailer'); // Import dynamique
  this.transporter = nodemailer.createTransport({...});
}
```

## 📝 Fichiers Modifiés

1. ✅ `apps/backend/materials-service/src/materials/services/daily-report.service.ts`
2. ✅ `apps/backend/materials-service/src/common/email/anomaly-email.service.ts`

## 🧪 Test de la Correction

### Étape 1: Redémarrer le service materials-service

```bash
cd apps/backend/materials-service
npm run start:dev
```

**IMPORTANT**: Le service DOIT être redémarré pour que les changements prennent effet!

### Étape 2: Tester l'envoi de rapport

**Option A - Via PowerShell**:
```powershell
$body = @{ email = "jamar.wisoky@ethereal.email" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3009/api/materials/reports/daily/send" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Option B - Via Frontend**:
1. Aller sur la page Materials
2. Cliquer sur "Generate AI Report"
3. Entrer: `jamar.wisoky@ethereal.email`
4. Cliquer "Generate & Send"

### Étape 3: Vérifier les logs backend

Vous devriez voir:
```
📊 Déclenchement manuel du rapport quotidien...
📧 Configuration SMTP: smtp.ethereal.email:587 (user: jamar.wisoky@ethereal.email)
✅ Connexion SMTP vérifiée avec succès
✅ Rapport quotidien envoyé à jamar.wisoky@ethereal.email
📬 Message ID: <message-id>
🔗 Prévisualisation Ethereal: https://ethereal.email/message/...
```

### Étape 4: Vérifier l'email sur Ethereal

1. Aller sur: https://ethereal.email/messages
2. Se connecter:
   - Username: `jamar.wisoky@ethereal.email`
   - Password: `ppg5A4AUcaFHWFP3DY`
3. Voir l'email avec le sujet: `[SmartSite] Rapport quotidien matériaux — [date]`

## 📊 Résultat Attendu

**Réponse API réussie**:
```json
{
  "success": true,
  "message": "Rapport quotidien envoyé avec succès à jamar.wisoky@ethereal.email",
  "timestamp": "2026-04-30T16:30:00.000Z"
}
```

**Email reçu sur Ethereal** avec:
- Statistiques des matériaux
- Matériaux en stock bas
- Matériaux en rupture
- Matériaux expirant
- Anomalies détectées
- Recommandations urgentes

## 🔧 Pourquoi cette solution fonctionne?

1. **require() est synchrone** et fonctionne avec CommonJS
2. **Pas de problème d'interopérabilité** entre ES modules et CommonJS
3. **Import dynamique** évite les problèmes de résolution de modules au build time
4. **Compatible avec TypeScript** en utilisant `import type` pour les types

## 🚨 Points Importants

1. **Redémarrage obligatoire**: Le service materials-service DOIT être redémarré
2. **Configuration .env**: Vérifier que les variables SMTP sont correctes
3. **Port 3009**: S'assurer que le service écoute sur le bon port
4. **Ethereal Email**: Service de test, les emails ne sont pas réellement envoyés

## 📚 Références

- Configuration email: `MATERIALS_EMAIL_CONFIG.md`
- Résumé des corrections: `EMAIL_REPORT_FIX_SUMMARY.md`
- Reconfiguration complète: `MATERIALS_EMAIL_RECONFIGURATION_COMPLETE.md`

## ✅ Checklist de Vérification

- [x] Import nodemailer corrigé dans daily-report.service.ts
- [x] Import nodemailer corrigé dans anomaly-email.service.ts
- [ ] Service materials-service redémarré
- [ ] Test d'envoi de rapport effectué
- [ ] Email reçu sur Ethereal vérifié
- [ ] Logs backend vérifiés

## 🎯 Prochaines Étapes

1. Redémarrer le service materials-service
2. Tester l'envoi de rapport
3. Vérifier l'email sur Ethereal
4. Continuer la traduction du frontend Materials en anglais
