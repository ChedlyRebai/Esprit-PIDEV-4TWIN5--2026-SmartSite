# SmartSite Translation Guide

## Overview
SmartSite uses a **React Context API** based internationalization (i18n) system supporting three languages:
- **English** (en)
- **Français** (fr)
- **العربية** (ar) - Arabic with RTL support

## How It Works

### 1. Global Setup
- **LanguageContext** (`src/app/context/LanguageContext.tsx`) - Manages global language state
- **translations.ts** (`src/app/context/translations.ts`) - All translation strings
- **LanguageSelector** (`src/app/components/LanguageSelector.tsx`) - UI component for language selection
- **App.tsx** - Wrapped with `LanguageProvider` at the root

### 2. Using Translations in Components

#### Step 1: Import the hook
```tsx
import { useTranslation } from "@/app/hooks/useTranslation";
```

#### Step 2: Use the hook in your component
```tsx
export default function MyComponent() {
  const { t, language } = useTranslation();
  
  return (
    <div>
      <h1>{t("nav.product")}</h1>
      <p>{t("hero.description")}</p>
    </div>
  );
}
```

### 3. Translation Key Pattern
Keys use **dot notation** for nested access:
- `nav.product` - Navigation product link
- `auth.login.title` - Login page title
- `dashboard.title` - Dashboard title

### 4. Adding New Translations

1. **Add to `translations.ts`**:
```typescript
export const translations = {
  en: {
    myFeature: {
      title: "My Title",
      description: "My Description"
    }
  },
  fr: {
    myFeature: {
      title: "Mon Titre",
      description: "Ma Description"
    }
  },
  ar: {
    myFeature: {
      title: "عنواني",
      description: "وصفي"
    }
  }
}
```

2. **Use in component**:
```tsx
const { t } = useTranslation();
<h2>{t("myFeature.title")}</h2>
```

### 5. Language Switching
The `LanguageSelector` component in the top-right corner (fixed position) automatically:
- Changes the language
- Updates all components using `useTranslation()`
- Switches RTL/LTR direction for Arabic
- Persists preference to localStorage

## Pages That Need Translation

### Priority 1 (High - User-facing)
- [ ] `src/app/pages/auth/Login.tsx` ✅ DONE
- [ ] `src/app/pages/auth/Register.tsx` - IN PROGRESS
- [ ] `src/app/pages/dashboards/Dashboard.tsx`
- [ ] `src/app/pages/dashboards/UserDashboard.tsx`
- [ ] Navigation components

### Priority 2 (Medium - Common features)
- [ ] `src/app/pages\team/Team.tsx`
- [ ] `src/app/pages/clients/ClientsNew.tsx`
- [ ] `src/app/pages/projects/ProjectsNew.tsx`
- [ ] All CRUD pages

### Priority 3 (Lower - Specialized pages)
- [ ] Dashboard variants for different roles
- [ ] Settings pages
- [ ] Report pages

## Common Text Keys

### Authentication
```
auth.login.title
auth.login.email
auth.login.password
auth.login.signIn
auth.login.signUp
auth.login.forgotPassword
```

### Navigation
```
nav.product
nav.features
nav.resources
nav.company
nav.login
```

### Dashboard
```
dashboard.title
dashboard.projects
dashboard.sites
dashboard.team
dashboard.materials
```

## Testing Translation

1. Click the language selector (top-right corner)
2. Choose a language (English, Français, العربية)
3. Verify ALL page text changes

## Troubleshooting

### Translations not appearing?
1. Check if component imports `useTranslation`
2. Verify key exists in `translations.ts`
3. Use correct dot notation: `"section.key"`
4. Check browser console for errors

### Language selector not updating pages?
1. Verify component that has text is using `useTranslation()` hook
2. Check if key is available in selected language
3. Make sure the component re-renders (using the `t` function from hook)

### RTL/LTR not working?
- Automatic! Just ensure Arabic (ar) uses proper translations
- The `LanguageContext` handles `document.dir` and `lang` attributes

## Example: Translating a Dashboard Page

**Before:**
```tsx
export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard</p>
      <button>Create Project</button>
    </div>
  );
}
```

**After:**
```tsx
import { useTranslation } from "@/app/hooks/useTranslation";

export default function Dashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.welcome")}</p>
      <button>{t("dashboard.createProject")}</button>
    </div>
  );
}
```

**Add to translations.ts:**
```typescript
dashboard: {
  title: "Dashboard",
  welcome: "Welcome to your dashboard", 
  createProject: "Create Project"
}
// Repeat for fr and ar...
```
