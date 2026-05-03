# 📖 Guide d'Utilisation - Détection des Anomalies de Vol et Gaspillage

**Version:** 1.0  
**Date:** 1er Mai 2026

---

## 🎯 Objectif

Ce guide vous explique comment utiliser la nouvelle fonctionnalité de détection automatique des risques de vol et gaspillage dans le module Materials Service.

---

## 🚀 Accès Rapide

### Navigation

1. Connectez-vous à SmartSite
2. Allez dans **Materials** (menu principal)
3. Cliquez sur **Flow Anomaly Analysis** (Analyse des Anomalies de Flux)

**URL Directe:** `/materials/flow-anomaly-analysis`

---

## 📊 Interface Principale

### 1. Sélection de la Période

En haut de la page, vous pouvez choisir la période d'analyse:

```
┌─────────────────────────────┐
│ Période d'analyse           │
│ [30 derniers jours ▼]      │
└─────────────────────────────┘
```

**Options disponibles:**
- 7 derniers jours
- 14 derniers jours
- 30 derniers jours (par défaut)
- 60 derniers jours
- 90 derniers jours

### 2. Cartes de Résumé

Trois cartes affichent les statistiques principales:

#### 🚨 Anomalies Critiques (Rouge)
- **Nombre:** Matériaux avec risque critique de vol/gaspillage
- **Critère:** Sorties > 200% des entrées
- **Action:** Intervention immédiate requise

#### ⚠️ Alertes (Orange)
- **Nombre:** Matériaux nécessitant attention
- **Critère:** Sorties > 150% des entrées
- **Action:** Vérification recommandée

#### 📦 Matériaux Analysés (Bleu)
- **Total:** Nombre de matériaux analysés
- **Avec anomalies:** Sous-total des matériaux problématiques

### 3. Statistiques de Flux

```
┌──────────────────────────────────────┐
│ ⬆️ Sorties Excessives: 5 matériaux  │
│ ⬇️ Entrées Excessives: 2 matériaux  │
└──────────────────────────────────────┘
```

---

## 🗺️ Analyse par Site

### Vue d'Ensemble

Pour chaque site avec anomalies, vous verrez:

```
┌─────────────────────────────────────────────┐
│ 📍 Chantier Nord                            │
│ 🚨 2 critiques  ⚠️ 5 alertes               │
│                                              │
│ [Détails ▼]                                 │
└─────────────────────────────────────────────┘
```

### Détails par Matériau

Cliquez sur **Détails** pour voir tous les matériaux du site:

```
┌─────────────────────────────────────────────┐
│ 🚨 CRITIQUE - Ciment                        │
│                                              │
│ 🚨 RISQUE CRITIQUE DE VOL/GASPILLAGE       │
│ Sorties (250) sont 250% supérieures aux    │
│ entrées (100). 5 anomalies détectées.      │
│                                              │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│ │ ⬇️ 100  │  │ ⬆️ 250  │  │ 📉 -150 │     │
│ │ Entrées │  │ Sorties │  │ Net     │     │
│ └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│ Ratio Sortie/Entrée: 250%                  │
│ ████████████████████ 250%                  │
│                                              │
│ ℹ️ 5 anomalies • Dernière: 30/04/2026     │
└─────────────────────────────────────────────┘
```

---

## 🎨 Codes Couleur et Niveaux de Risque

### 🔴 CRITIQUE
- **Critère:** Sorties > 200% des entrées
- **Exemple:** 100 entrées, 250 sorties (ratio 250%)
- **Action:** **URGENT** - Enquête immédiate requise
- **Causes possibles:**
  - Vol de matériaux
  - Erreurs de saisie importantes
  - Gaspillage massif

### 🟠 ÉLEVÉ
- **Critère:** Sorties entre 150% et 200% des entrées
- **Exemple:** 100 entrées, 180 sorties (ratio 180%)
- **Action:** Vérification dans les 24h
- **Causes possibles:**
  - Utilisation excessive
  - Mauvaise gestion
  - Début de problème

### 🟡 MOYEN
- **Critère:** Sorties entre 120% et 150% des entrées
- **Exemple:** 100 entrées, 130 sorties (ratio 130%)
- **Action:** Surveillance renforcée
- **Causes possibles:**
  - Variations normales
  - Optimisation possible

### 🔵 FAIBLE
- **Critère:** Sorties < 120% des entrées
- **Exemple:** 100 entrées, 95 sorties (ratio 95%)
- **Action:** Aucune action requise
- **Statut:** Flux normal

---

## 📈 Interprétation des Données

### Statistiques de Flux

#### Entrées (⬇️ Vert)
- Somme de tous les flux entrants (IN, RETURN)
- Représente les matériaux reçus sur la période

#### Sorties (⬆️ Rouge)
- Somme de tous les flux sortants (OUT, DAMAGE)
- Représente les matériaux utilisés/perdus

#### Flux Net (📉 Violet)
- Calcul: Entrées - Sorties
- **Négatif:** Plus de sorties que d'entrées (⚠️ Attention)
- **Positif:** Plus d'entrées que de sorties (✅ Normal)

### Ratio Sortie/Entrée

**Formule:** `(Sorties / Entrées) × 100`

**Exemples:**
- **95%:** Normal - Légèrement moins de sorties que d'entrées
- **100%:** Équilibré - Sorties = Entrées
- **150%:** ⚠️ Alerte - 50% de sorties en plus
- **250%:** 🚨 Critique - 2.5× plus de sorties

---

## 🔍 Cas d'Usage

### Cas 1: Détection de Vol

**Situation:**
```
Matériau: Ciment Portland
Période: 30 jours
Entrées: 50 sacs
Sorties: 150 sacs
Ratio: 300%
```

**Analyse:**
- 🚨 **CRITIQUE** - Risque de vol évident
- 100 sacs manquants (150 - 50)
- Ratio 3× supérieur à la normale

**Actions à Prendre:**
1. Vérifier tous les bons de sortie
2. Contrôler le stock physique
3. Interroger les responsables
4. Vérifier les caméras de surveillance
5. Renforcer les contrôles d'accès

### Cas 2: Gaspillage Détecté

**Situation:**
```
Matériau: Peinture Blanche
Période: 30 jours
Entrées: 40 litres
Sorties: 70 litres
Ratio: 175%
```

**Analyse:**
- ⚠️ **ÉLEVÉ** - Utilisation excessive
- 30 litres de surconsommation
- Possible gaspillage ou mauvaise technique

**Actions à Prendre:**
1. Former les équipes sur l'application
2. Vérifier la qualité de la peinture
3. Contrôler les surfaces peintes
4. Optimiser les méthodes d'application
5. Surveiller les prochaines utilisations

### Cas 3: Erreur de Saisie

**Situation:**
```
Matériau: Briques
Période: 30 jours
Entrées: 10 palettes
Sorties: 100 palettes
Ratio: 1000%
```

**Analyse:**
- 🚨 **CRITIQUE** - Probablement une erreur
- Ratio irréaliste (10×)
- Vérification urgente nécessaire

**Actions à Prendre:**
1. Vérifier les bons d'entrée
2. Contrôler les bons de sortie
3. Corriger les erreurs de saisie
4. Former sur la saisie correcte
5. Mettre à jour les données

---

## 🛠️ Fonctionnalités Avancées

### Filtrage par Site

Pour analyser un site spécifique:
1. Utilisez le paramètre `siteId` dans l'URL
2. Ou filtrez depuis l'interface (si disponible)

### Export des Données

Pour exporter l'analyse:
1. Cliquez sur le bouton **Export** (si disponible)
2. Choisissez le format (PDF, Excel)
3. Téléchargez le rapport

### Actualisation

Pour actualiser les données:
1. Cliquez sur le bouton **🔄 Actualiser**
2. Les données sont rechargées en temps réel

---

## 📱 Utilisation Mobile

L'interface est responsive et s'adapte aux mobiles:

- **Cartes empilées** verticalement
- **Détails pliables** pour économiser l'espace
- **Swipe** pour naviguer entre les sites
- **Touch-friendly** pour une utilisation tactile

---

## ⚡ Raccourcis Clavier

- `R` : Actualiser les données
- `1-5` : Changer la période (7, 14, 30, 60, 90 jours)
- `↑/↓` : Naviguer entre les sites
- `Enter` : Développer/Réduire les détails

---

## 🎓 Bonnes Pratiques

### Fréquence de Consultation

- **Quotidienne:** Pour les sites à risque
- **Hebdomadaire:** Pour les sites normaux
- **Mensuelle:** Pour l'analyse de tendances

### Seuils d'Alerte

- **> 200%:** Intervention immédiate
- **150-200%:** Vérification sous 24h
- **120-150%:** Surveillance renforcée
- **< 120%:** Flux normal

### Documentation

Pour chaque anomalie critique:
1. Capturer l'écran
2. Noter la date et l'heure
3. Documenter les actions prises
4. Suivre la résolution

---

## 🐛 Problèmes Courants

### Aucune Anomalie Affichée

**Causes possibles:**
- Aucun flux enregistré sur la période
- Tous les flux sont normaux
- Problème de connexion

**Solutions:**
1. Vérifier la période sélectionnée
2. Augmenter la durée d'analyse
3. Vérifier les données dans "Flow Log"

### Trop d'Anomalies

**Causes possibles:**
- Seuils trop sensibles
- Problème de qualité des données
- Période d'analyse trop longue

**Solutions:**
1. Réduire la période d'analyse
2. Filtrer par site spécifique
3. Vérifier la qualité des saisies

### Données Incohérentes

**Causes possibles:**
- Erreurs de saisie
- Problème de synchronisation
- Données corrompues

**Solutions:**
1. Vérifier les bons de mouvement
2. Corriger les erreurs dans "Flow Log"
3. Contacter le support technique

---

## 📞 Support

### Aide en Ligne
- **Documentation:** https://docs.smartsite.com
- **Tutoriels vidéo:** https://videos.smartsite.com
- **FAQ:** https://faq.smartsite.com

### Contact
- **Email:** support@smartsite.com
- **Téléphone:** +33 1 23 45 67 89
- **Chat:** Disponible 24/7 dans l'application

### Formation
- **Sessions en ligne:** Tous les mardis 14h
- **Formation sur site:** Sur demande
- **Webinaires:** Mensuels

---

## ✅ Checklist Utilisateur

### Utilisation Quotidienne
- [ ] Consulter les anomalies critiques
- [ ] Vérifier les nouveaux sites à risque
- [ ] Documenter les actions prises
- [ ] Actualiser les données

### Utilisation Hebdomadaire
- [ ] Analyser les tendances
- [ ] Comparer avec la semaine précédente
- [ ] Identifier les améliorations
- [ ] Planifier les actions correctives

### Utilisation Mensuelle
- [ ] Générer le rapport mensuel
- [ ] Présenter à la direction
- [ ] Évaluer l'efficacité des actions
- [ ] Ajuster les processus

---

## 🎯 Objectifs de Performance

### KPIs à Suivre
- **Taux de détection:** > 95%
- **Temps de résolution:** < 48h pour critiques
- **Réduction des pertes:** > 30% sur 6 mois
- **Satisfaction utilisateurs:** > 4/5

### Métriques de Succès
- Diminution du nombre d'anomalies critiques
- Amélioration du ratio entrée/sortie
- Réduction des coûts de matériaux
- Augmentation de la traçabilité

---

**Besoin d'aide ?** Contactez le support à support@smartsite.com

**Version du Guide:** 1.0  
**Dernière Mise à Jour:** 1er Mai 2026
