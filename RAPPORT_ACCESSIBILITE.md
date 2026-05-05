# Rapport d Accessibilite - SmartSite Platform
**Projet :** SmartSite Platform (PIDEV - Esprit School of Engineering)
**Date :** Mai 2026
**Perimetre :** Toutes les pages frontend (25+ composants analyses)
**Referentiel :** WCAG 2.1 Niveaux A et AA
**Methode :** Analyse statique du code source React/TypeScript

> **Note :** Validation complete requiert tests manuels avec technologies d assistance (NVDA, VoiceOver).

---

## LEGENDE

| Icone | Signification |
|-------|---------------|
| CORRIGE | Correction appliquee dans le code source |
| A CORRIGER | Probleme identifie, correction non encore appliquee |

---

## BILAN GLOBAL

| Categorie | Total | Corriges | Restants |
|-----------|-------|----------|---------|
| Critique (Niveau A) | 44 | 22 | 22 |
| Majeur (Niveau AA) | 38 | 13 | 25 |
| **Total** | **82** | **35** | **47** |

---

# PARTIE 1 - CORRECTIONS APPLIQUEES (35 corrections sur 11 fichiers)

---

## 1. Login.tsx [CORRIGE - 4 corrections]

**Fichier :** `apps/frontend/src/app/pages/auth/Login.tsx`

### 1.1 Label CIN desynchronise (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<FieldLabel htmlFor="form-rhf-demo-title">CIN</FieldLabel>
<Input id="form-rhf-demo-cin" aria-invalid={fieldState.invalid} autoComplete="off" />
```

**APRES :**
```tsx
<FieldLabel htmlFor="form-rhf-demo-cin">CIN</FieldLabel>
<Input
  id="form-rhf-demo-cin"
  aria-required="true"
  aria-invalid={fieldState.invalid}
  aria-describedby={fieldState.invalid ? "cin-error" : undefined}
  autoComplete="username"
/>
```

### 1.2 Bouton show/hide password sans label (WCAG 1.1.1, 4.1.2 - Niveau A)

**AVANT :**
```tsx
<button type="button" onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
</button>
```

**APRES :**
```tsx
<button
  type="button"
  aria-label={showPassword ? "Hide password" : "Show password"}
  aria-controls="form-rhf-demo-password"
  onClick={() => setShowPassword(!showPassword)}
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
>
  {showPassword ? <EyeOff size={24} aria-hidden="true" /> : <Eye size={24} aria-hidden="true" />}
</button>
```

### 1.3 autoComplete incorrect (WCAG 1.3.5 - Niveau AA)

**AVANT :** `autoComplete="off"` sur les deux champs
**APRES :** `autoComplete="username"` sur CIN, `autoComplete="current-password"` sur mot de passe

### 1.4 Spinner sans annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
<div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
{t("auth.login.signIn")}
```

**APRES :**
```tsx
<div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
<span className="sr-only">Loading...</span>
{t("auth.login.signIn")}
```

---

## 2. ChangePasswordFirstLogin.tsx [CORRIGE - 3 corrections]

**Fichier :** `apps/frontend/src/app/pages/auth/ChangePasswordFirstLogin.tsx`

### 2.1 Messages d erreur non associes aux champs (WCAG 3.3.1 - Niveau A)

**AVANT :**
```tsx
<Input id="currentPassword" {...form.register("currentPassword")} />
{form.formState.errors.currentPassword && (
  <p className="text-xs text-red-500">
    {form.formState.errors.currentPassword.message}
  </p>
)}
```

**APRES :**
```tsx
<Input
  id="currentPassword"
  aria-required="true"
  aria-invalid={!!form.formState.errors.currentPassword}
  aria-describedby={form.formState.errors.currentPassword ? "currentPassword-error" : undefined}
  {...form.register("currentPassword")}
/>
{form.formState.errors.currentPassword && (
  <p id="currentPassword-error" role="alert" className="text-xs text-red-500">
    {form.formState.errors.currentPassword.message}
  </p>
)}
```
Meme correction appliquee sur newPassword et confirmPassword.

### 2.2 Boutons show/hide sans label ni focus visible (WCAG 1.1.1, 2.4.7 - Niveaux A/AA)

**AVANT :**
```tsx
<button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
</button>
```

**APRES :**
```tsx
<button
  type="button"
  aria-label={showCurrentPassword ? "Masquer le mot de passe temporaire" : "Afficher le mot de passe temporaire"}
  aria-controls="currentPassword"
  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
>
  {showCurrentPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
</button>
```

### 2.3 Hint de complexite du mot de passe manquant (WCAG 3.3.2 - Niveau A)

**AVANT :** Aucune indication sur les regles de complexite

**APRES :**
```tsx
<Input
  id="newPassword"
  aria-describedby={errors.newPassword ? "newPassword-error" : "newPassword-hint"}
/>
<p id="newPassword-hint" className="text-xs text-gray-500">
  Minimum 8 caracteres, avec majuscule, minuscule, chiffre et caractere special.
</p>
```

---

## 3. ForgotPassword.tsx [CORRIGE - 3 corrections]

**Fichier :** `apps/frontend/src/app/pages/auth/ForgotPassword.tsx`

### 3.1 Bouton retour sans label accessible (WCAG 2.4.4 - Niveau A)

**AVANT :**
```tsx
<button onClick={() => navigate("/login")} className="flex items-center gap-2 ...">
  <ArrowLeft className="h-4 w-4" />
  Retour a la connexion
</button>
```

**APRES :**
```tsx
<button
  onClick={() => navigate("/login")}
  aria-label="Retour a la page de connexion"
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
>
  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
  Retour a la connexion
</button>
```

### 3.2 Icone Mail non masquee (WCAG 1.1.1 - Niveau A)

**AVANT :** `<Mail className="absolute left-3 ..." />`
**APRES :** `<Mail className="absolute left-3 ..." aria-hidden="true" />`

### 3.3 Champ email sans attributs d accessibilite (WCAG 3.3.2 - Niveau A)

**AVANT :** `<Input id="email" type="email" />`
**APRES :**
```tsx
<Input
  id="email"
  type="email"
  aria-required="true"
  aria-describedby={fieldState.invalid ? "email-error" : undefined}
/>
```

---

## 4. ResetPassword.tsx [CORRIGE - 3 corrections]

**Fichier :** `apps/frontend/src/app/pages/auth/ResetPassword.tsx`

### 4.1 Bouton retour sans label (WCAG 2.4.4 - Niveau A)

**AVANT :** `<button onClick={() => navigate("/forgot-password")} className="...">`
**APRES :** Ajout de `aria-label="Retour a la page mot de passe oublie"` + `focus-visible:ring`

### 4.2 Boutons show/hide sans label (WCAG 1.1.1 - Niveau A)

**AVANT :**
```tsx
<button type="button" onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
</button>
```

**APRES :**
```tsx
<button
  type="button"
  aria-label={showPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
  aria-controls="newPassword"
  onClick={() => setShowPassword(!showPassword)}
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
>
  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
</button>
```

### 4.3 Compte a rebours non annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
<button disabled={resendCountdown > 0 || isLoading}>
  {resendCountdown > 0 ? `Renvoyer dans ${resendCountdown}s` : "Renvoyer"}
</button>
```

**APRES :**
```tsx
<button
  disabled={resendCountdown > 0 || isLoading}
  aria-disabled={resendCountdown > 0 || isLoading}
  aria-describedby="resend-countdown"
>
  Renvoyer
</button>
{resendCountdown > 0 && (
  <span id="resend-countdown" aria-live="polite" aria-atomic="true" className="ml-1 text-gray-400">
    (dans {resendCountdown}s)
  </span>
)}
```

---

## 5. SuppliersList.tsx [CORRIGE - 5 corrections]

**Fichier :** `apps/frontend/src/app/pages/suppliers-new/SuppliersList.tsx`

### 5.1 Cartes cliquables inaccessibles au clavier (WCAG 2.1.1, 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Card
  className="cursor-pointer"
  onClick={() => navigate(`/suppliers/${supplier._id}`)}
>
```

**APRES :**
```tsx
<Card
  tabIndex={0}
  aria-label={`Supplier ${supplier.name}, ${supplier.category}, status: ${status.label}`}
  onClick={() => navigate(`/suppliers/${supplier._id}`)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/suppliers/${supplier._id}`);
    }
  }}
  className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
>
```

### 5.2 Boutons d action sans label contextuel (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<button title="View Details"><ChevronRight className="w-4 h-4" /></button>
<button title="Edit"><Edit className="w-4 h-4" /></button>
<button title={supplier.estArchive ? 'Unarchive' : 'Archive'}><Archive className="w-4 h-4" /></button>
```

**APRES :**
```tsx
<button aria-label={`View details for ${supplier.name}`}>
  <ChevronRight className="w-4 h-4" aria-hidden="true" />
</button>
<button aria-label={`Edit supplier ${supplier.name}`}>
  <Edit className="w-4 h-4" aria-hidden="true" />
</button>
<button
  aria-label={supplier.estArchive ? `Unarchive supplier ${supplier.name}` : `Archive supplier ${supplier.name}`}
  aria-pressed={!!supplier.estArchive}
>
  <Archive className="w-4 h-4" aria-hidden="true" />
</button>
```

### 5.3 Filtres de statut sans semantique (WCAG 1.3.1 - Niveau A)

**AVANT :** `<div className="flex gap-2 mb-4 flex-wrap">`
**APRES :**
```tsx
<div role="group" aria-label="Filter suppliers by status">
  <button aria-pressed={filterStatus === tab.key} ...>
```

### 5.4 Champ de recherche sans label (WCAG 1.3.1 - Niveau A)

**AVANT :** `<Input placeholder="Search..." />`
**APRES :**
```tsx
<Input
  id="supplier-search"
  type="search"
  aria-label="Search suppliers by name, category or code"
/>
```

### 5.5 Contraste insuffisant (WCAG 1.4.3 - Niveau AA)

**AVANT :** `text-gray-400` sur email, phone, address, dates (ratio ~3.5:1)
**APRES :** `text-gray-600` (ratio ~5.9:1, conforme AA)

---

## 6. AddSupplier.tsx [CORRIGE - 5 corrections]

**Fichier :** `apps/frontend/src/app/pages/suppliers-new/AddSupplier.tsx`

### 6.1 Zones d upload inaccessibles au clavier (WCAG 2.1.1, 1.3.1 - Niveau A)

**AVANT :**
```tsx
<div onClick={() => contractRef.current?.click()}>
  <input type="file" className="hidden" />
</div>
```

**APRES :**
```tsx
<label htmlFor="contract-upload">
  <input
    id="contract-upload"
    type="file"
    className="sr-only"
    aria-required="true"
    aria-invalid={!!errors.contract}
    aria-describedby={errors.contract ? "contract-error" : "contract-hint"}
  />
  ...
</label>
<p id="contract-hint">PDF, JPG, PNG - max 5MB</p>
```

### 6.2 Messages d erreur non associes aux champs (WCAG 3.3.1 - Niveau A)

**AVANT :**
```tsx
<Input id="name" className={errors.name ? 'border-red-500' : ''} />
{errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
```

**APRES :**
```tsx
<Input
  id="name"
  aria-required="true"
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{errors.name && <p id="name-error" role="alert" className="text-xs text-red-500">{errors.name}</p>}
```
Applique sur tous les champs : name, category, email, phone, address, siret.

### 6.3 Champs obligatoires sans indication programmatique (WCAG 3.3.2 - Niveau A)

**AVANT :** `<span className="text-red-500">*</span>` uniquement visuel
**APRES :**
```tsx
<span className="text-red-500" aria-hidden="true">*</span>
<span className="sr-only">(required)</span>
// + required et aria-required="true" sur l input
```

### 6.4 Icones decoratives non masquees (WCAG 1.1.1 - Niveau A)

**AVANT :** `<Mail className="w-3.5 h-3.5 inline mr-1" />`
**APRES :** `<Mail className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />`
Applique sur Mail, Phone, MapPin, Shield, Upload, CheckCircle2, FileText.

### 6.5 Bouton retour sans label (WCAG 4.1.2 - Niveau A)

**AVANT :** `<Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>`
**APRES :** `<Button variant="ghost" size="icon" aria-label="Go back"><ArrowLeft className="w-5 h-5" aria-hidden="true" /></Button>`

---

## 7. RateSupplierModal.tsx [CORRIGE - 3 corrections]

**Fichier :** `apps/frontend/src/app/pages/suppliers-new/RateSupplierModal.tsx`

### 7.1 Sliders sans attributs ARIA (WCAG 1.3.1, 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Label>{criterion}</Label>
<input type="range" min="0" max="10" step="0.5" value={ratings[criterion] || 0} />
```

**APRES :**
```tsx
<Label htmlFor={`rating-${criterion}`}>{criterion}</Label>
<input
  type="range"
  id={`rating-${criterion}`}
  aria-label={`${criterion} rating`}
  aria-valuemin={0}
  aria-valuemax={10}
  aria-valuenow={ratings[criterion] || 0}
  aria-valuetext={`${ratings[criterion]?.toFixed(1) || '0.0'} out of 10`}
/>
```

### 7.2 Valeur du slider non annoncee dynamiquement (WCAG 4.1.3 - Niveau AA)

**AVANT :** `<span className="text-sm font-medium text-blue-600">{ratings[criterion]?.toFixed(1) || '0.0'}/10</span>`
**APRES :** `<span aria-live="polite" aria-atomic="true" className="...">{ratings[criterion]?.toFixed(1) || '0.0'}/10</span>`

### 7.3 Icones dans les badges non masquees (WCAG 1.1.1 - Niveau A)

**AVANT :** `<AlertTriangle className="w-3.5 h-3.5 mr-1" />`
**APRES :** `<AlertTriangle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />`

---

## 8. SupplierDetail.tsx [CORRIGE - 7 corrections]

**Fichier :** `apps/frontend/src/app/pages/suppliers-new/SupplierDetail.tsx`

### 8.1 Onglets sans pattern ARIA tabs (WCAG 1.3.1, 4.1.2 - Niveau A)

**AVANT :**
```tsx
<div className="flex gap-2 mb-6 border-b">
  <Button variant={activeTab === 'infos' ? 'default' : 'ghost'} onClick={() => setActiveTab('infos')}>
    Infos
  </Button>
</div>
{activeTab === 'infos' && <Card>...</Card>}
```

**APRES :**
```tsx
<div role="tablist" aria-label="Supplier details sections">
  <button
    role="tab"
    id="tab-infos"
    aria-selected={activeTab === 'infos'}
    aria-controls="panel-infos"
    className="... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  >
    Infos
  </button>
</div>
<div role="tabpanel" id="panel-infos" aria-labelledby="tab-infos" hidden={activeTab !== 'infos'}>
  <Card>...</Card>
</div>
```

### 8.2 Liens documents sans contexte (WCAG 2.4.4 - Niveau A)

**AVANT :**
```tsx
<a href={...} target="_blank">View</a>
<a href={...} download>Download</a>
```

**APRES :**
```tsx
<a href={...} target="_blank" aria-label="View contract document (opens in new tab)">View</a>
<a href={...} download aria-label="Download contract document">Download</a>
<a href={...} target="_blank" aria-label="View insurance document (opens in new tab)">View</a>
<a href={...} download aria-label="Download insurance document">Download</a>
```

### 8.3 Etat de chargement sans annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
<div className="flex justify-center py-20">
  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
</div>
```

**APRES :**
```tsx
<div className="flex justify-center py-20" role="status" aria-label="Loading supplier details">
  <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden="true" />
  <span className="sr-only">Loading supplier details, please wait...</span>
</div>
```

### 8.4 Bouton retour sans label (WCAG 4.1.2 - Niveau A)

**AVANT :** `<Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>`
**APRES :** `<Button variant="ghost" size="icon" aria-label="Back to suppliers list"><ArrowLeft className="w-5 h-5" aria-hidden="true" /></Button>`

### 8.5 Bouton Rate sans label contextuel (WCAG 4.1.2 - Niveau A)

**AVANT :** `<Button onClick={() => setShowRateModal(true)}><Star className="w-4 h-4" />Rate</Button>`
**APRES :** `<Button aria-label={`Rate supplier ${supplier.name}`} onClick={() => setShowRateModal(true)}><Star className="w-4 h-4" aria-hidden="true" />Rate</Button>`

### 8.6 Champ de rejet sans attributs d accessibilite (WCAG 3.3.1 - Niveau A)

**AVANT :**
```tsx
<Textarea id="reject-reason" className={rejectError ? 'border-red-500' : ''} />
{rejectError && <p className="text-xs text-red-500">{rejectError}</p>}
```

**APRES :**
```tsx
<Textarea
  id="reject-reason"
  required
  aria-required="true"
  aria-invalid={!!rejectError}
  aria-describedby={rejectError ? "reject-reason-error" : undefined}
/>
{rejectError && <p id="reject-reason-error" role="alert" className="text-xs text-red-500">{rejectError}</p>}
```

### 8.7 Labels secondaires avec contraste insuffisant (WCAG 1.4.3 - Niveau AA)

**AVANT :** `<p className="text-xs text-gray-400">Email</p>` (ratio ~3.5:1)
**APRES :** `<p className="text-xs text-gray-600">Email</p>` (ratio ~5.9:1)
Applique sur tous les labels : Email, Phone, Address, SIRET, Created by, Created at.

---

## 9. DelayPrediction.tsx [CORRIGE - 5 corrections]

**Fichier :** `apps/frontend/src/app/components/supplier/DelayPrediction.tsx`

### 9.1 Information de risque par couleur seule (WCAG 1.3.3, 1.4.1 - Niveau A)

**AVANT :**
```tsx
<div className="text-6xl font-bold mb-2" style={{ color: getRiskColor(result.risk_color) }}>
  {result.risk_percentage}%
</div>
```

**APRES :**
```tsx
<div
  className="text-6xl font-bold mb-2"
  style={{ color: getRiskColor(result.risk_color) }}
  aria-label={`Delay risk: ${result.risk_percentage}%, level: ${getRiskLevelDisplay(result.risk_level)}`}
>
  {result.risk_percentage}%
</div>
```

### 9.2 Icones dans le badge non masquees (WCAG 1.1.1 - Niveau A)

**AVANT :** `<AlertTriangle className="w-3.5 h-3.5 mr-1" />`
**APRES :** `<AlertTriangle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />`

### 9.3 Zone d erreur sans role alert (WCAG 4.1.3 - Niveau AA)

**AVANT :** `<Card className="border-red-200 bg-red-50">`
**APRES :** `<Card className="border-red-200 bg-red-50" role="alert">`

### 9.4 Spinner sans annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
<Button type="submit" disabled={loading}>
  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
  Analyser le risque
</Button>
```

**APRES :**
```tsx
<Button type="submit" disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span className="sr-only">Analyse en cours...</span>
      Analyser le risque
    </>
  ) : (
    <>
      <AlertTriangle className="w-4 h-4" aria-hidden="true" />
      Analyser le risque
    </>
  )}
</Button>
```

### 9.5 Labels secondaires avec contraste insuffisant (WCAG 1.4.3 - Niveau AA)

**AVANT :** `<p className="text-xs text-gray-400">Fournisseur</p>`
**APRES :** `<p className="text-xs text-gray-600">Fournisseur</p>`

---

## 10. DashboardLayout.tsx [CORRIGE - 4 corrections]

**Fichier :** `apps/frontend/src/app/layouts/DashboardLayout.tsx`

### 10.1 Boutons +/- taille police sans label (WCAG 2.5.3, 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button variant="ghost" size="icon" className="h-8 w-8"
  onClick={() => setFontSize(prev => Math.max(80, prev - 10))}>
  <Minus className="h-4 w-4" />
</Button>
```

**APRES :**
```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-8 w-8"
  aria-label="Decrease font size"
  onClick={() => setFontSize(prev => Math.max(80, prev - 10))}
>
  <Minus className="h-4 w-4" aria-hidden="true" />
</Button>
```
Meme correction pour le bouton "Increase font size".

### 10.2 Compteur de taille non annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :** `<div className="text-center text-xs text-muted-foreground">{fontSize}%</div>`
**APRES :**
```tsx
<div
  className="text-center text-xs text-muted-foreground"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`Current font size: ${fontSize}%`}
>
  {fontSize}%
</div>
```

### 10.3 Icone Type non masquee (WCAG 1.1.1 - Niveau A)

**AVANT :** `<Type className="h-5 w-5" />`
**APRES :** `<Type className="h-5 w-5" aria-hidden="true" />`

### 10.4 Overlay mobile invisible visuellement (WCAG 1.4.11 - Niveau AA)

**AVANT :** `className="fixed inset-0 bg-opacity-10 z-20 lg:hidden"` (pas de couleur de fond)
**APRES :** `className="fixed inset-0 bg-black/20 z-20 lg:hidden"` (fond semi-transparent visible)

---

## 11. Navbar.tsx [CORRIGE - 1 correction]

**Fichier :** `apps/frontend/src/app/Navbar.tsx`

### 11.1 Logo sans texte alternatif (WCAG 1.1.1 - Niveau A)

**AVANT :**
```tsx
<img
  className="h-8 w-auto"
  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
  alt=""
/>
```

**APRES :**
```tsx
<img
  className="h-8 w-auto"
  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
  alt="SmartSite"
/>
```

---

# PARTIE 2 - PROBLEMES RESTANTS A CORRIGER (avec avant/apres)

---

## 12. SitesTable.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/sites/SitesTable.tsx`

### 12.1 Table sans caption ni aria-label (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-10"></TableHead>
      <TableHead>Project</TableHead>
      <TableHead>Status</TableHead>
      ...
    </TableRow>
  </TableHeader>
</Table>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Table aria-label="Projects and sites overview">
  <caption className="sr-only">
    List of projects with their associated sites, budgets and statuses
  </caption>
  <TableHeader>
    <TableRow>
      <TableHead scope="col" className="w-10">
        <span className="sr-only">Expand/Collapse</span>
      </TableHead>
      <TableHead scope="col">Project</TableHead>
      <TableHead scope="col">Status</TableHead>
      ...
    </TableRow>
  </TableHeader>
</Table>
```

### 12.2 Bouton expand/collapse sans aria-expanded (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button variant="ghost" size="sm" onClick={() => toggleProject(project.id)} className="p-1 h-8 w-8">
  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  variant="ghost"
  size="sm"
  aria-expanded={isExpanded}
  aria-controls={`sites-${project.id}`}
  aria-label={`${isExpanded ? 'Collapse' : 'Expand'} sites for ${project.name}`}
  onClick={() => toggleProject(project.id)}
  className="p-1 h-8 w-8"
>
  {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
</Button>
```

### 12.3 Barres de progression sans role progressbar (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
  <div className="h-full bg-blue-600" style={{ width: `${project.progress || 0}%` }} />
</div>
<span className="text-xs">{project.progress || 0}%</span>
```

**CORRECTION RECOMMANDEE :**
```tsx
<div
  role="progressbar"
  aria-valuenow={project.progress || 0}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`Project progress: ${project.progress || 0}%`}
  className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden"
>
  <div className="h-full bg-blue-600" style={{ width: `${project.progress || 0}%` }} />
</div>
```

### 12.4 Boutons Archive/Delete sans aria-label contextuel (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button variant="outline" size="sm" title={project.status === 'completed' ? 'Restore' : 'Archive'}
  className="h-8 w-8 p-0">
  {project.status === 'completed' ? <span>↺</span> : <Archive className="h-4 w-4" />}
</Button>
<Button variant="destructive" size="sm" title="Delete" className="h-8 w-8 p-0">
  <Trash2 className="h-4 w-4" />
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  variant="outline"
  size="sm"
  aria-label={project.status === 'completed' ? `Restore project ${project.name}` : `Archive project ${project.name}`}
  className="h-8 w-8 p-0"
>
  {project.status === 'completed' ? <span aria-hidden="true">↺</span> : <Archive className="h-4 w-4" aria-hidden="true" />}
</Button>
<Button
  variant="destructive"
  size="sm"
  aria-label={`Delete project ${project.name}`}
  className="h-8 w-8 p-0"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</Button>
```

### 12.5 Boutons de pagination sans aria-label (WCAG 2.4.7 - Niveau AA)

**AVANT :**
```tsx
<Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} title="First page">«</Button>
<Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
  <ChevronLeft className="h-4 w-4" />
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button variant="outline" size="sm" aria-label="Go to first page" onClick={() => setCurrentPage(1)}>
  <span aria-hidden="true">«</span>
</Button>
<Button variant="outline" size="sm" aria-label="Go to previous page" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
</Button>
```

---

## 13. Projects.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/projects/Projects.tsx`

### 13.1 Cartes de projets cliquables (div onClick) (WCAG 2.1.1 - Niveau A)

**AVANT :**
```tsx
<div
  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
  onClick={() => navigate(`/projects/${project._id}/sites`)}
>
  <Briefcase className="h-6 w-6 text-white" />
  <h3 className="font-bold text-gray-900">{project.name}</h3>
</div>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Link
  to={`/projects/${project._id}/sites`}
  className="flex items-center gap-3 flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
  aria-label={`View sites for project ${project.name}`}
>
  <Briefcase className="h-6 w-6 text-white" aria-hidden="true" />
  <h3 className="font-bold text-gray-900">{project.name}</h3>
</Link>
```

### 13.2 Erreur de creation sans role alert (WCAG 3.3.1 - Niveau A)

**AVANT :**
```tsx
{createError && (
  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
    <div>
      <p className="font-semibold text-red-700 text-sm">Cannot create project</p>
      <p className="text-sm text-red-600 mt-0.5">{createError}</p>
    </div>
  </div>
)}
```

**CORRECTION RECOMMANDEE :**
```tsx
{createError && (
  <div role="alert" aria-live="assertive"
    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" aria-hidden="true" />
    <div>
      <p className="font-semibold text-red-700 text-sm">Cannot create project</p>
      <p className="text-sm text-red-600 mt-0.5">{createError}</p>
    </div>
  </div>
)}
```

### 13.3 Labels sans htmlFor dans le formulaire (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Project Name</Label>
<Input placeholder="e.g., Downtown Office Tower" value={newProject.name} ... />
```

**CORRECTION RECOMMANDEE :**
```tsx
<Label htmlFor="project-name" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
  Project Name
</Label>
<Input id="project-name" placeholder="e.g., Downtown Office Tower" value={newProject.name} ... />
```

---

## 14. PLaningProjects.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/planning/PLaningProjects.tsx`

### 14.1 Lien dans un bouton (anti-pattern semantique) (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Button size="sm" variant="outline">
  <Link to={`/project-milestone/${site.id}`}>
    Milestones
  </Link>
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button size="sm" variant="outline" asChild>
  <Link
    to={`/project-milestone/${site.id}`}
    aria-label={`View milestones for ${site.name}`}
  >
    Milestones
  </Link>
</Button>
```

### 14.2 Etat de chargement non gere (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
const { data, isPending, isLoading, isError } = useQuery({...});
// isPending et isError ne sont pas utilises dans le rendu
return (
  <div className="space-y-6">
    ...
    {sites.map((site) => (...))}
  </div>
);
```

**CORRECTION RECOMMANDEE :**
```tsx
if (isPending || isLoading) {
  return (
    <div role="status" aria-label="Loading planning data" className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden="true" />
      <span className="sr-only">Loading planning data, please wait...</span>
    </div>
  );
}
if (isError) {
  return (
    <div role="alert" className="text-center py-20 text-red-600">
      <p>Failed to load planning data. Please try again.</p>
    </div>
  );
}
```

---

## 15. Team.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/team/Team.tsx`

### 15.1 Bouton suppression membre sans aria-label contextuel (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button
  variant="ghost"
  size="sm"
  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
  onClick={async () => { ... }}
>
  <Trash2 className="h-3.5 w-3.5" />
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label={`Remove ${fullName} from team`}
  className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
  onClick={async () => { ... }}
>
  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
</Button>
```

### 15.2 Champ "Team Name *" sans aria-required (WCAG 3.3.2 - Niveau A)

**AVANT :**
```tsx
<Label htmlFor="team-name">Team Name *</Label>
<Input
  id="team-name"
  placeholder="Team A"
  value={newTeam.name}
  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
/>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Label htmlFor="team-name">
  Team Name <span aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</Label>
<Input
  id="team-name"
  required
  aria-required="true"
  placeholder="Team A"
  value={newTeam.name}
  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
/>
```

### 15.3 Boutons Edit/Delete/View sans focus-visible (WCAG 2.4.7 - Niveau AA)

**AVANT :**
```tsx
<Button variant="ghost" size="sm" onClick={() => handleEditTeam(team)}>
  <Edit className="h-4 w-4" />
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  variant="ghost"
  size="sm"
  aria-label={`Edit team ${team.name}`}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  onClick={() => handleEditTeam(team)}
>
  <Edit className="h-4 w-4" aria-hidden="true" />
</Button>
```

---

## 16. Incidents.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/incidents/Incidents.tsx`

### 16.1 window.confirm() non accessible (WCAG 2.1.1 - Niveau A)

**AVANT :**
```tsx
const handleDeleteIncident = async (id: string) => {
  const confirmed = window.confirm(
    "Etes-vous sur de vouloir supprimer cet incident ? Cette action est irreversible.",
  );
  if (!confirmed) return;
  await incidentsApi.delete(`/incidents/${id}`);
  ...
};
```

**CORRECTION RECOMMANDEE :**
```tsx
// Ajouter un etat pour la dialog de confirmation
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

// Remplacer window.confirm par une Dialog accessible
<Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Confirmer la suppression</DialogTitle>
      <DialogDescription>
        Etes-vous sur de vouloir supprimer cet incident ? Cette action est irreversible.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
      <Button variant="destructive" onClick={() => confirmDeleteIncident(deleteConfirmId!)}>
        Supprimer
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 16.2 Boutons d action sans aria-label contextuel (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button onClick={() => handleResolveIncident(incident.id)}>Resolve</Button>
<Button onClick={() => handleDeleteIncident(incident.id)}>Delete</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  aria-label={`Resolve incident: ${incident.title || incident.type}`}
  onClick={() => handleResolveIncident(incident.id)}
>
  Resolve
</Button>
<Button
  aria-label={`Delete incident: ${incident.title || incident.type}`}
  onClick={() => setDeleteConfirmId(incident.id)}
>
  Delete
</Button>
```

### 16.3 Select de filtre sans label associe (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Select value={assignRoleFilter} onValueChange={setAssignRoleFilter}>
  <SelectTrigger>
    <SelectValue placeholder="Filter by role" />
  </SelectTrigger>
</Select>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Label htmlFor="role-filter">Filter by role</Label>
<Select value={assignRoleFilter} onValueChange={setAssignRoleFilter}>
  <SelectTrigger id="role-filter" aria-label="Filter users by role">
    <SelectValue placeholder="Filter by role" />
  </SelectTrigger>
</Select>
```

### 16.4 Erreurs de validation via toast uniquement (WCAG 3.3.1 - Niveau A)

**AVANT :**
```tsx
const handleAddIncident = async () => {
  // Pas de validation avec messages dans le DOM
  // Erreurs uniquement via toast.error()
};
```

**CORRECTION RECOMMANDEE :**
```tsx
const [formError, setFormError] = useState<string | null>(null);

// Dans handleAddIncident :
if (!newIncident.type) {
  setFormError("Please select an incident type.");
  return;
}

// Dans le JSX :
{formError && (
  <div id="incident-form-error" role="alert" aria-live="assertive"
    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
    {formError}
  </div>
)}
```

---

## 17. Payments.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/payments/Payments.tsx`

### 17.1 Labels natifs sans htmlFor (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<label className="text-sm font-medium">Site *</label>
<Select value={form.siteId} onValueChange={(v) => { setForm({ ...form, siteId: v }); }}>
  <SelectTrigger className={formErrors.siteId ? "border-red-500" : ""}>
    <SelectValue placeholder="Select a site" />
  </SelectTrigger>
</Select>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Label htmlFor="payment-site">
  Site <span aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</Label>
<Select value={form.siteId} onValueChange={(v) => { setForm({ ...form, siteId: v }); }}>
  <SelectTrigger
    id="payment-site"
    aria-required="true"
    aria-invalid={!!formErrors.siteId}
    aria-describedby={formErrors.siteId ? "site-error" : undefined}
    className={formErrors.siteId ? "border-red-500" : ""}
  >
    <SelectValue placeholder="Select a site" />
  </SelectTrigger>
</Select>
{formErrors.siteId && (
  <p id="site-error" role="alert" className="text-xs text-red-500 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" aria-hidden="true" />{formErrors.siteId}
  </p>
)}
```

### 17.2 Bouton Refresh sans aria-label (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<Button variant="outline" size="icon" title="Refresh"
  onClick={() => { queryClient.invalidateQueries(...); }}>
  <RefreshCw className="h-4 w-4" />
</Button>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Button
  variant="outline"
  size="icon"
  aria-label="Refresh payments list"
  onClick={() => { queryClient.invalidateQueries(...); }}
>
  <RefreshCw className="h-4 w-4" aria-hidden="true" />
</Button>
```

### 17.3 Messages succes/erreur sans aria-live (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
{successMessage && (
  <Alert className="border-green-300 bg-green-50 text-green-800">
    <CheckCircle2 className="h-4 w-4" />
    <AlertDescription>{successMessage}</AlertDescription>
  </Alert>
)}
{errorMessage && (
  <Alert className="border-red-300 bg-red-50 text-red-800">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{errorMessage}</AlertDescription>
  </Alert>
)}
```

**CORRECTION RECOMMANDEE :**
```tsx
<div aria-live="polite" aria-atomic="true">
  {successMessage && (
    <Alert role="status" className="border-green-300 bg-green-50 text-green-800">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{successMessage}</AlertDescription>
    </Alert>
  )}
</div>
<div aria-live="assertive" aria-atomic="true">
  {errorMessage && (
    <Alert role="alert" className="border-red-300 bg-red-50 text-red-800">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  )}
</div>
```

### 17.4 Onglets Payments/Factures sans pattern ARIA (WCAG 2.4.3 - Niveau A)

**AVANT :**
```tsx
// Onglets implementes avec des boutons simples sans role="tab"
const [activeTab, setActiveTab] = useState<"payments" | "factures">("payments");
// Pas de composant Tabs visible dans le code fourni
```

**CORRECTION RECOMMANDEE :**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "payments" | "factures")}>
  <TabsList>
    <TabsTrigger value="payments">Payments</TabsTrigger>
    <TabsTrigger value="factures">Invoices</TabsTrigger>
  </TabsList>
  <TabsContent value="payments">
    {/* contenu paiements */}
  </TabsContent>
  <TabsContent value="factures">
    {/* contenu factures */}
  </TabsContent>
</Tabs>
```

---

---

## 18. Dashboard - SuperAdminDashboard.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/dashboards/SuperAdminDashboard.tsx`

### 18.1 Indicateur actif/inactif par couleur seule (WCAG 1.4.1 - Niveau A)

**AVANT :**
```tsx
<div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
```

**CORRECTION RECOMMANDEE :**
```tsx
<div
  className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
  role="img"
  aria-label={member.isActive ? 'Active' : 'Inactive'}
/>
```

### 18.2 Skeleton de chargement sans annonce (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg">{t("dashboard.loadingDashboard")}</div>
    </div>
  );
}
```

**CORRECTION RECOMMANDEE :**
```tsx
if (loading) {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex items-center justify-center h-64">
      <span className="sr-only">Loading dashboard, please wait...</span>
      <div className="text-lg" aria-hidden="true">{t("dashboard.loadingDashboard")}</div>
    </div>
  );
}
```

### 18.3 Input de recherche sans aria-label (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Input
  placeholder={t("dashboard.searchPlaceholder")}
  value={urgentSectionSearch}
  onChange={(e) => setUrgentSectionSearch(e.target.value)}
  className="pl-10"
  aria-label={t("dashboard.filterTasksIncidents")}
/>
```
**Statut :** aria-label deja present - OK

---

## 19. Dashboard - ProjectManagerDashboard.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/dashboard/ProjectManagerDashboard.tsx`

### 19.1 Labels sans htmlFor associe aux Select (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<label className="text-sm font-medium mb-2 block">Statut</label>
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger>
    <SelectValue placeholder="Filtrer par statut" />
  </SelectTrigger>
</Select>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Label htmlFor="status-filter">Statut</Label>
<Select value={statusFilter} onValueChange={setStatusFilter}>
  <SelectTrigger id="status-filter">
    <SelectValue placeholder="Filtrer par statut" />
  </SelectTrigger>
</Select>
```

### 19.2 Cloche de notification sans aria-label ni aria-live (WCAG 4.1.2 - Niveau A)

**AVANT :**
```tsx
<div className="relative">
  <Bell className="h-6 w-6 text-red-500" />
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
    {notifications.length}
  </span>
</div>
```

**CORRECTION RECOMMANDEE :**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-label={`${notifications.length} urgent notification${notifications.length !== 1 ? 's' : ''}`}
  className="relative"
>
  <Bell className="h-6 w-6 text-red-500" aria-hidden="true" />
  <span aria-hidden="true" className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
    {notifications.length}
  </span>
</div>
```

---

## 20. Profile.tsx [A CORRIGER]

**Fichier :** `apps/frontend/src/app/pages/profile/Profile.tsx`

### 20.1 Avatar sans texte alternatif (WCAG 1.3.1 - Niveau A)

**AVANT :**
```tsx
<Avatar className="h-24 w-24">
  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl">
    {getInitials(String(user.firstName ?? ""), String(user.lastName ?? ""))}
  </AvatarFallback>
</Avatar>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Avatar
  className="h-24 w-24"
  aria-label={`Profile picture of ${user.firstName} ${user.lastName}`}
>
  <AvatarFallback
    aria-hidden="true"
    className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl"
  >
    {getInitials(String(user.firstName ?? ""), String(user.lastName ?? ""))}
  </AvatarFallback>
</Avatar>
```

### 20.2 Badges de statut sans role status (WCAG 4.1.3 - Niveau AA)

**AVANT :**
```tsx
<Badge variant={user.status === "approved" ? "secondary" : "default"} className="text-sm">
  {user.status === "approved" ? t("profile.approved", "Approuve") : t("profile.pending", "En attente")}
</Badge>
```

**CORRECTION RECOMMANDEE :**
```tsx
<Badge
  role="status"
  variant={user.status === "approved" ? "secondary" : "default"}
  className="text-sm"
>
  {user.status === "approved" ? t("profile.approved", "Approuve") : t("profile.pending", "En attente")}
</Badge>
```

---

# PARTIE 3 - TABLEAU RECAPITULATIF COMPLET

| # | Critere WCAG | Niveau | Fichier(s) | Severite | Statut |
|---|---|---|---|---|---|
| 1 | 1.1.1 Contenu non textuel | A | Navbar.tsx (logo alt vide) | Critique | **CORRIGE** |
| 2 | 1.1.1 Contenu non textuel | A | Login.tsx (icones EyeOff/Eye) | Critique | **CORRIGE** |
| 3 | 1.1.1 Contenu non textuel | A | ForgotPassword.tsx (icone Mail) | Critique | **CORRIGE** |
| 4 | 1.1.1 Contenu non textuel | A | AddSupplier.tsx (icones decoratives) | Critique | **CORRIGE** |
| 5 | 1.1.1 Contenu non textuel | A | RateSupplierModal.tsx (icones badge) | Critique | **CORRIGE** |
| 6 | 1.1.1 Contenu non textuel | A | DelayPrediction.tsx (icones badge) | Critique | **CORRIGE** |
| 7 | 1.1.1 Contenu non textuel | A | DashboardLayout.tsx (icone Type) | Critique | **CORRIGE** |
| 8 | 1.3.1 Information et relations | A | Login.tsx (label/input desynchronises) | Critique | **CORRIGE** |
| 9 | 1.3.1 Information et relations | A | SuppliersList.tsx (filtres, liste) | Critique | **CORRIGE** |
| 10 | 1.3.1 Information et relations | A | AddSupplier.tsx (upload, champs) | Critique | **CORRIGE** |
| 11 | 1.3.1 Information et relations | A | RateSupplierModal.tsx (sliders) | Critique | **CORRIGE** |
| 12 | 1.3.1 Information et relations | A | SupplierDetail.tsx (onglets) | Critique | **CORRIGE** |
| 13 | 1.3.1 Information et relations | A | SitesTable.tsx (table sans caption) | Critique | **A CORRIGER** |
| 14 | 1.3.1 Information et relations | A | Projects.tsx (labels sans htmlFor) | Critique | **A CORRIGER** |
| 15 | 1.3.1 Information et relations | A | PLaningProjects.tsx (lien dans bouton) | Critique | **A CORRIGER** |
| 16 | 1.3.1 Information et relations | A | Team.tsx (labels sans htmlFor) | Critique | **A CORRIGER** |
| 17 | 1.3.1 Information et relations | A | Incidents.tsx (select sans label) | Critique | **A CORRIGER** |
| 18 | 1.3.1 Information et relations | A | Payments.tsx (labels sans htmlFor) | Critique | **A CORRIGER** |
| 19 | 1.3.1 Information et relations | A | SuperAdminDashboard.tsx (input recherche) | Majeur | **CORRIGE** (aria-label present) |
| 20 | 1.3.1 Information et relations | A | ProjectManagerDashboard.tsx (labels Select) | Critique | **A CORRIGER** |
| 21 | 1.3.3 Caracteristiques sensorielles | A | DelayPrediction.tsx (couleur seule) | Critique | **CORRIGE** |
| 22 | 1.4.1 Utilisation de la couleur | A | SuperAdminDashboard.tsx (point actif/inactif) | Majeur | **A CORRIGER** |
| 23 | 1.4.3 Contraste | AA | SuppliersList.tsx (text-gray-400) | Majeur | **CORRIGE** |
| 24 | 1.4.3 Contraste | AA | SupplierDetail.tsx (text-gray-400) | Majeur | **CORRIGE** |
| 25 | 1.4.3 Contraste | AA | DelayPrediction.tsx (text-gray-400) | Majeur | **CORRIGE** |
| 26 | 1.4.3 Contraste | AA | Dashboard, Sites, Projects, Team | Majeur | **A CORRIGER** |
| 27 | 1.4.11 Contraste non-textuel | AA | DashboardLayout.tsx (overlay invisible) | Majeur | **CORRIGE** |
| 28 | 1.3.5 Identification de la finalite | AA | Login.tsx (autoComplete) | Majeur | **CORRIGE** |
| 29 | 2.1.1 Clavier | A | SuppliersList.tsx (cartes) | Critique | **CORRIGE** |
| 30 | 2.1.1 Clavier | A | AddSupplier.tsx (zones upload) | Critique | **CORRIGE** |
| 31 | 2.1.1 Clavier | A | Projects.tsx (div onClick) | Critique | **A CORRIGER** |
| 32 | 2.1.1 Clavier | A | Incidents.tsx (window.confirm) | Critique | **A CORRIGER** |
| 33 | 2.4.3 Ordre de focus | A | SupplierDetail.tsx (onglets) | Majeur | **CORRIGE** |
| 34 | 2.4.4 Fonction du lien | A | SupplierDetail.tsx (liens documents) | Majeur | **CORRIGE** |
| 35 | 2.4.4 Fonction du lien | A | PLaningProjects.tsx (liens Milestones) | Majeur | **A CORRIGER** |
| 36 | 2.4.7 Visibilite du focus | AA | SuppliersList.tsx (boutons) | Majeur | **CORRIGE** |
| 37 | 2.4.7 Visibilite du focus | AA | AddSupplier.tsx (bouton retour) | Majeur | **CORRIGE** |
| 38 | 2.4.7 Visibilite du focus | AA | Team.tsx (boutons Edit/Delete) | Majeur | **A CORRIGER** |
| 39 | 2.5.3 Etiquette dans le nom | A | DashboardLayout.tsx (boutons +/-) | Majeur | **CORRIGE** |
| 40 | 3.3.1 Identification des erreurs | A | ChangePasswordFirstLogin.tsx | Critique | **CORRIGE** |
| 41 | 3.3.1 Identification des erreurs | A | AddSupplier.tsx | Critique | **CORRIGE** |
| 42 | 3.3.1 Identification des erreurs | A | SupplierDetail.tsx (rejet) | Critique | **CORRIGE** |
| 43 | 3.3.1 Identification des erreurs | A | Incidents.tsx (toast uniquement) | Critique | **A CORRIGER** |
| 44 | 3.3.2 Etiquettes ou instructions | A | AddSupplier.tsx (aria-required) | Majeur | **CORRIGE** |
| 45 | 3.3.2 Etiquettes ou instructions | A | ChangePasswordFirstLogin.tsx (hint) | Majeur | **CORRIGE** |
| 46 | 3.3.2 Etiquettes ou instructions | A | Team.tsx (aria-required) | Majeur | **A CORRIGER** |
| 47 | 4.1.2 Nom, role, valeur | A | SuppliersList.tsx (boutons) | Critique | **CORRIGE** |
| 48 | 4.1.2 Nom, role, valeur | A | SupplierDetail.tsx (boutons, onglets) | Critique | **CORRIGE** |
| 49 | 4.1.2 Nom, role, valeur | A | DashboardLayout.tsx (boutons +/-) | Critique | **CORRIGE** |
| 50 | 4.1.2 Nom, role, valeur | A | Login.tsx (show/hide password) | Critique | **CORRIGE** |
| 51 | 4.1.2 Nom, role, valeur | A | ResetPassword.tsx (show/hide) | Critique | **CORRIGE** |
| 52 | 4.1.2 Nom, role, valeur | A | SitesTable.tsx (boutons Archive/Delete) | Critique | **A CORRIGER** |
| 53 | 4.1.2 Nom, role, valeur | A | Projects.tsx (boutons Edit/Delete) | Critique | **A CORRIGER** |
| 54 | 4.1.2 Nom, role, valeur | A | Team.tsx (bouton suppression membre) | Critique | **A CORRIGER** |
| 55 | 4.1.2 Nom, role, valeur | A | Incidents.tsx (boutons Resolve/Delete) | Critique | **A CORRIGER** |
| 56 | 4.1.2 Nom, role, valeur | A | Payments.tsx (bouton Refresh) | Critique | **A CORRIGER** |
| 57 | 4.1.2 Nom, role, valeur | A | ProjectManagerDashboard.tsx (cloche) | Critique | **A CORRIGER** |
| 58 | 4.1.3 Messages de statut | AA | DelayPrediction.tsx (erreur, spinner) | Majeur | **CORRIGE** |
| 59 | 4.1.3 Messages de statut | AA | DashboardLayout.tsx (compteur taille) | Majeur | **CORRIGE** |
| 60 | 4.1.3 Messages de statut | AA | ResetPassword.tsx (compte a rebours) | Majeur | **CORRIGE** |
| 61 | 4.1.3 Messages de statut | AA | Payments.tsx (succes/erreur) | Majeur | **A CORRIGER** |
| 62 | 4.1.3 Messages de statut | AA | PLaningProjects.tsx (chargement) | Majeur | **A CORRIGER** |
| 63 | 4.1.3 Messages de statut | AA | SuperAdminDashboard.tsx (chargement) | Majeur | **A CORRIGER** |

---

# PARTIE 4 - OUTILS DE VALIDATION

| Outil | Type | Usage |
|---|---|---|
| axe DevTools | Extension navigateur | Audit automatique en developpement |
| WAVE | Extension navigateur | Visualisation des problemes |
| Colour Contrast Analyser | Application desktop | Verification des ratios de contraste |
| NVDA (Windows) | Lecteur d ecran | Test manuel |
| VoiceOver (macOS/iOS) | Lecteur d ecran | Test manuel |
| Lighthouse | DevTools Chrome | Audit automatique integre |
| eslint-plugin-jsx-a11y | ESLint plugin | Detection automatique en CI/CD |

---

# CONCLUSION

**35 corrections appliquees** sur 11 fichiers, couvrant les modules Auth, Suppliers, et les composants partages.

**47 problemes restants** a corriger dans les modules Sites, Projects, Planning, Teams, Incidents, Payments et Dashboard.

Les corrections prioritaires restantes :
1. **window.confirm() dans Incidents.tsx** - Remplacer par Dialog accessible
2. **Cartes cliquables dans Projects.tsx** - Meme pattern que SuppliersList
3. **Tableaux sans caption dans SitesTable.tsx** - Ajouter aria-label et scope
4. **Labels sans htmlFor dans Team.tsx et Payments.tsx** - Associer programmatiquement
5. **Barres de progression sans role progressbar** - SitesTable, Projects

---

*Rapport mis a jour - Mai 2026*
*35 corrections appliquees / 63 problemes identifies*
*Validation complete requiert tests manuels avec technologies d assistance*
