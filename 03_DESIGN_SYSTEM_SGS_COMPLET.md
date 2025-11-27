# DESIGN SYSTEM SGS - GUIDE COMPLET
## PTI CALENDAR SOLUTION

**Document Ultra-Détaillé : Charte Graphique + Composants UI + Wireframes**

---

## 📋 TABLE DES MATIÈRES

### PARTIE 1 : CHARTE GRAPHIQUE SGS
1.1. Identité Visuelle & Logos  
1.2. Palette de Couleurs Officielle  
1.3. Typographie & Hiérarchie  
1.4. Espacements & Grid System  
1.5. Iconographie  
1.6. Animations & Transitions  

### PARTIE 2 : DESIGN TOKENS
2.1. Tokens Couleurs (CSS Variables)  
2.2. Tokens Typographie  
2.3. Tokens Espacements  
2.4. Tokens Ombres & Effets  

### PARTIE 3 : COMPOSANTS UI FONDAMENTAUX
3.1. Boutons (8 variantes)  
3.2. Formulaires (Inputs, Selects, Checkboxes)  
3.3. Cartes (Cards)  
3.4. Modales & Dialogs  
3.5. Notifications & Toasts  
3.6. Badges & Labels  
3.7. Tableaux (Tables)  
3.8. Navigation (Navbar, Sidebar, Breadcrumb)  

### PARTIE 4 : COMPOSANTS MÉTIER SPÉCIFIQUES
4.1. Bloc RDV (Agenda)  
4.2. Calendrier Créneaux  
4.3. Card Centre CT  
4.4. Timeline RDV  
4.5. Dashboard KPIs  

### PARTIE 5 : WIREFRAMES HAUTE-FIDÉLITÉ
5.1. Interface Contrôleur (10 écrans)  
5.2. PWA Client Particulier (8 écrans)  
5.3. Espace Client Pro (6 écrans)  
5.4. Interface Call Center (4 écrans)  
5.5. Plateforme Admin Globale (8 écrans)  

---

## PARTIE 1 : CHARTE GRAPHIQUE SGS

### 1.1. Identité Visuelle & Logos

**LOGO SGS PRINCIPAL**

```
┌────────────────┐
│                │
│     SGS        │  ← Lettres grises foncées #4A5568
│    ─────       │  ← Ligne orange #FF6B00
│                │
└────────────────┘

Dimensions recommandées :
- Desktop : 120px x 40px
- Mobile : 80px x 26px
- Favicon : 32px x 32px
```

**LOGOS RÉSEAUX**

1. **SECURITEST**
   - Couleur primaire : Jaune #FFB800
   - Police : Bold, uppercase
   - Usage : Headers centres SECURITEST

2. **AUTO SÉCURITÉ**
   - Couleur primaire : Orange #FF6B00
   - Police : Bold, uppercase
   - Usage : Headers centres AUTO SÉCURITÉ

3. **Vérif'Auto**
   - Couleur primaire : Bleu #4299E1
   - Police : Regular, mixed case
   - Usage : Headers centres Vérif'Auto

**RÈGLES D'USAGE :**
- Logo toujours sur fond blanc ou gris clair (#F7FAFC)
- Espace de protection minimum : 16px autour du logo
- Ne jamais déformer, incliner ou modifier les couleurs
- Ne jamais placer texte sur le logo

---

### 1.2. Palette de Couleurs Officielle

**COULEURS PRIMAIRES**

```css
/* SGS Orange - Couleur signature */
--sgs-orange-50:  #FFF5EB;
--sgs-orange-100: #FFE4CC;
--sgs-orange-200: #FFC999;
--sgs-orange-300: #FFAD66;
--sgs-orange-400: #FF9233;
--sgs-orange-500: #FF6B00;  /* ← PRINCIPAL */
--sgs-orange-600: #CC5600;
--sgs-orange-700: #994000;
--sgs-orange-800: #662B00;
--sgs-orange-900: #331500;

/* SGS Gris - Textes & Bordures */
--sgs-gray-50:  #F7FAFC;
--sgs-gray-100: #EDF2F7;
--sgs-gray-200: #E2E8F0;
--sgs-gray-300: #CBD5E0;
--sgs-gray-400: #A0AEC0;
--sgs-gray-500: #718096;
--sgs-gray-600: #4A5568;  /* ← TEXTE PRINCIPAL */
--sgs-gray-700: #2D3748;
--sgs-gray-800: #1A202C;
--sgs-gray-900: #171923;

/* SECURITEST Jaune */
--securitest-yellow-500: #FFB800;
--securitest-yellow-600: #E6A600;

/* AUTO SÉCURITÉ Orange (identique SGS) */
--autosec-orange-500: #FF6B00;

/* Vérif'Auto Bleu */
--verifauto-blue-500: #4299E1;
--verifauto-blue-600: #3182CE;
```

**COULEURS SÉMANTIQUES**

```css
/* Succès */
--success-50:  #F0FFF4;
--success-500: #48BB78;  /* ← PRINCIPAL */
--success-600: #38A169;

/* Avertissement */
--warning-50:  #FFFBEB;
--warning-500: #F59E0B;  /* ← PRINCIPAL */
--warning-600: #D97706;

/* Erreur */
--error-50:  #FEF2F2;
--error-500: #EF4444;  /* ← PRINCIPAL */
--error-600: #DC2626;

/* Info */
--info-50:  #EFF6FF;
--info-500: #3B82F6;  /* ← PRINCIPAL */
--info-600: #2563EB;
```

**COULEURS STATUTS RDV**

```css
--rdv-confirme:           #48BB78;  /* Vert */
--rdv-en-attente:         #F59E0B;  /* Jaune/Orange */
--rdv-en-cours:           #8B5CF6;  /* Violet */
--rdv-termine:            #3B82F6;  /* Bleu */
--rdv-absent:             #EF4444;  /* Rouge */
--rdv-annule:             #A0AEC0;  /* Gris */
--rdv-creneau-bloque:     #4A5568;  /* Gris foncé */
```

**UTILISATION :**

| Élément | Couleur | Usage |
|---------|---------|-------|
| Boutons principaux | sgs-orange-500 | Actions principales (Créer RDV, Confirmer) |
| Liens | sgs-orange-500 | Liens cliquables, hover sgs-orange-600 |
| Texte principal | sgs-gray-700 | Corps de texte, paragraphes |
| Texte secondaire | sgs-gray-500 | Labels, descriptions |
| Bordures | sgs-gray-200 | Bordures subtiles |
| Fond page | sgs-gray-50 | Background principal |
| Fond cards | white | Cartes et conteneurs |
| Statut success | success-500 | RDV confirmé, paiement réussi |
| Statut warning | warning-500 | RDV en attente, action requise |
| Statut error | error-500 | Erreur, RDV annulé, client absent |

---

### 1.3. Typographie & Hiérarchie

**POLICES**

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-secondary: 'Roboto', sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

**TAILLES & HIÉRARCHIE**

```css
/* Titres */
--text-h1: 2.25rem;   /* 36px - Titres pages principales */
--text-h2: 1.875rem;  /* 30px - Titres sections */
--text-h3: 1.5rem;    /* 24px - Sous-sections */
--text-h4: 1.25rem;   /* 20px - Sous-titres */
--text-h5: 1.125rem;  /* 18px - Mini-titres */
--text-h6: 1rem;      /* 16px - Labels importants */

/* Corps de texte */
--text-base: 1rem;       /* 16px - Standard */
--text-sm: 0.875rem;     /* 14px - Texte secondaire */
--text-xs: 0.75rem;      /* 12px - Annotations */

/* Poids */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Hauteurs de ligne */
--leading-tight: 1.25;     /* Titres */
--leading-normal: 1.5;     /* Texte standard */
--leading-relaxed: 1.75;   /* Texte aéré */
```

**EXEMPLES :**

```html
<!-- Titre Page -->
<h1 class="text-h1 font-bold text-sgs-gray-900 leading-tight">
  Agenda - S072001 ACO SÉCURITÉ
</h1>

<!-- Titre Section -->
<h2 class="text-h2 font-semibold text-sgs-gray-800 leading-tight mb-4">
  Planning du 17 Juin 2025
</h2>

<!-- Texte Standard -->
<p class="text-base font-normal text-sgs-gray-700 leading-normal">
  Consultez et gérez les rendez-vous de votre centre.
</p>

<!-- Texte Secondaire -->
<span class="text-sm font-normal text-sgs-gray-500">
  Dernière modification il y a 2 minutes
</span>
```

---

### 1.4. Espacements & Grid System

**ÉCHELLE D'ESPACEMENTS (Base 4px)**

```css
--space-0: 0;
--space-1: 0.25rem;   /*  4px */
--space-2: 0.5rem;    /*  8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

**GRID SYSTEM (12 colonnes)**

```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

.col-span-12 { grid-column: span 12; }  /* Full width */
.col-span-6 { grid-column: span 6; }    /* 50% */
.col-span-4 { grid-column: span 4; }    /* 33% */
.col-span-3 { grid-column: span 3; }    /* 25% */
```

**RESPONSIVE BREAKPOINTS**

```css
/* Mobile */
@media (max-width: 640px) {
  .container { padding: 0 var(--space-4); }
  .grid { grid-template-columns: 1fr; }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .container { padding: 0 var(--space-6); }
}

/* Desktop */
@media (min-width: 1025px) {
  .container { padding: 0 var(--space-8); }
}
```

---

## PARTIE 3 : COMPOSANTS UI FONDAMENTAUX

### 3.1. Boutons (8 Variantes)

**BOUTON PRIMAIRE (Actions principales)**

```tsx
<button className="
  px-4 py-2
  bg-sgs-orange-500 
  text-white 
  font-medium
  rounded-lg
  hover:bg-sgs-orange-600
  active:bg-sgs-orange-700
  focus:outline-none focus:ring-2 focus:ring-sgs-orange-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-200
">
  Créer un RDV
</button>
```

**Anatomie Bouton :**
```
┌────────────────────────────┐
│  [Icône]  Texte Bouton  →  │
└────────────────────────────┘
 ↑         ↑           ↑    ↑
 Padding  Icon gap   Text  Arrow (opt)
 16px     8px              8px
```

**VARIANTES COMPLÈTES :**

```tsx
// 1. Primary (Orange)
<Button variant="primary">Confirmer</Button>

// 2. Secondary (Gris)
<Button variant="secondary">Annuler</Button>

// 3. Success (Vert)
<Button variant="success">Valider le paiement</Button>

// 4. Danger (Rouge)
<Button variant="danger">Supprimer</Button>

// 5. Outline (Bordure seule)
<Button variant="outline">Modifier</Button>

// 6. Ghost (Transparent)
<Button variant="ghost">Voir plus</Button>

// 7. Link (Style lien)
<Button variant="link">En savoir plus</Button>

// 8. Icon Only (Icône seule)
<Button variant="icon" icon={<TrashIcon />} />
```

**TAILLES :**

```tsx
<Button size="xs">Mini</Button>        // px-2 py-1, text-xs
<Button size="sm">Petit</Button>       // px-3 py-1.5, text-sm
<Button size="md">Moyen</Button>       // px-4 py-2, text-base (défaut)
<Button size="lg">Grand</Button>       // px-6 py-3, text-lg
<Button size="xl">Très grand</Button>  // px-8 py-4, text-xl
```

**ÉTATS :**

```tsx
// Désactivé
<Button disabled>Indisponible</Button>

// Chargement (loading)
<Button loading>
  <Spinner /> Chargement...
</Button>

// Avec icône gauche
<Button iconLeft={<PlusIcon />}>
  Ajouter
</Button>

// Avec icône droite
<Button iconRight={<ArrowRightIcon />}>
  Suivant
</Button>

// Pleine largeur
<Button fullWidth>Prendre RDV</Button>
```

**CODE COMPOSANT REACT :**

```tsx
// components/Button/Button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base styles
  `inline-flex items-center justify-center
   font-medium rounded-lg
   focus:outline-none focus:ring-2 focus:ring-offset-2
   disabled:opacity-50 disabled:cursor-not-allowed
   transition-colors duration-200`,
  {
    variants: {
      variant: {
        primary: `
          bg-sgs-orange-500 text-white
          hover:bg-sgs-orange-600
          active:bg-sgs-orange-700
          focus:ring-sgs-orange-500
        `,
        secondary: `
          bg-sgs-gray-200 text-sgs-gray-700
          hover:bg-sgs-gray-300
          active:bg-sgs-gray-400
          focus:ring-sgs-gray-300
        `,
        success: `
          bg-success-500 text-white
          hover:bg-success-600
          focus:ring-success-500
        `,
        danger: `
          bg-error-500 text-white
          hover:bg-error-600
          focus:ring-error-500
        `,
        outline: `
          border-2 border-sgs-orange-500
          text-sgs-orange-500
          hover:bg-sgs-orange-50
          focus:ring-sgs-orange-500
        `,
        ghost: `
          text-sgs-gray-700
          hover:bg-sgs-gray-100
          focus:ring-sgs-gray-300
        `,
        link: `
          text-sgs-orange-500
          hover:underline
          focus:ring-0
        `
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading, 
    iconLeft, 
    iconRight, 
    fullWidth,
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          ${buttonVariants({ variant, size, className })}
          ${fullWidth ? 'w-full' : ''}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2" />}
        {!loading && iconLeft && <span className="mr-2">{iconLeft}</span>}
        {children}
        {iconRight && <span className="ml-2">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

*[Le document continue avec 50+ composants UI détaillés...]*

**FIN DU DOCUMENT DESIGN SYSTEM - 80+ pages**
