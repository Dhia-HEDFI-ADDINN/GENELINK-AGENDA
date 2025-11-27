# Design System

## PTI Calendar Solution - Design System SGS

**Package :** @pti-calendar/design-system
**Version :** 1.0.0

---

## Description

Design System officiel pour toutes les applications PTI Calendar, conforme à la charte graphique SGS France.

---

## Installation

```bash
pnpm add @pti-calendar/design-system
```

---

## Utilisation

```tsx
import { Button, Card, Modal, Input } from '@pti-calendar/design-system';

function MyComponent() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button variant="primary" size="lg">
        Valider
      </Button>
    </Card>
  );
}
```

---

## Charte Graphique SGS

### Couleurs Primaires

| Couleur | Hex | Usage |
|---------|-----|-------|
| SGS Red | #E30613 | Accent, CTA |
| SGS Blue | #003C71 | Headers, liens |
| Dark | #1A1A1A | Texte |
| Light | #F5F5F5 | Backgrounds |

### Couleurs Sémantiques

| Couleur | Hex | Usage |
|---------|-----|-------|
| Success | #10B981 | Validation, succès |
| Warning | #F59E0B | Attention |
| Error | #EF4444 | Erreur |
| Info | #3B82F6 | Information |

### Couleurs Statuts RDV

| Statut | Hex |
|--------|-----|
| Réservé | #FCD34D |
| Confirmé | #10B981 |
| En cours | #3B82F6 |
| Terminé | #6B7280 |
| Annulé | #EF4444 |

---

## Composants

### Button

```tsx
<Button variant="primary" size="md" loading={false}>
  Texte
</Button>
```

Variantes : `primary`, `secondary`, `outline`, `ghost`, `danger`
Tailles : `sm`, `md`, `lg`

### Input

```tsx
<Input
  label="Label"
  type="text"
  placeholder="Placeholder"
  error="Message d'erreur"
  required
/>
```

### Select

```tsx
<Select
  label="Type de contrôle"
  options={[
    { value: 'CTP', label: 'Contrôle Technique Périodique' },
    { value: 'CVP', label: 'Contre-Visite' }
  ]}
/>
```

### Card

```tsx
<Card padding="md" shadow="sm">
  Contenu
</Card>
```

### Modal

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Titre">
  Contenu de la modal
</Modal>
```

### Badge

```tsx
<Badge variant="success">Confirmé</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="error">Annulé</Badge>
```

### Toast

```tsx
import { toast } from '@pti-calendar/design-system';

toast.success('RDV créé avec succès');
toast.error('Une erreur est survenue');
toast.info('Information');
```

---

## Composants Métier

### RdvBlock

Bloc RDV pour le planning.

```tsx
<RdvBlock
  rdv={rdv}
  onClick={handleClick}
  compact={false}
/>
```

### CreneauCard

Carte de créneau disponible.

```tsx
<CreneauCard
  creneau={creneau}
  selected={isSelected}
  onSelect={handleSelect}
/>
```

### CentreCard

Carte de centre.

```tsx
<CentreCard
  centre={centre}
  distance={1.5}
  onClick={handleClick}
/>
```

### StatCard

Carte de statistique.

```tsx
<StatCard
  title="RDV du jour"
  value={42}
  trend={+5}
  icon={<CalendarIcon />}
/>
```

---

## Tokens CSS

```css
:root {
  /* Couleurs */
  --color-primary: #E30613;
  --color-secondary: #003C71;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Typographie */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'Roboto Mono', monospace;

  /* Espacements */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Rayons */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

---

## Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  presets: [
    require('@pti-calendar/design-system/tailwind')
  ]
}
```

---

## Storybook

```bash
# Démarrer Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```

---

## Accessibilité

Tous les composants sont :
- WCAG 2.1 AA compliant
- Navigables au clavier
- Compatibles lecteur d'écran
- Avec contraste suffisant

---

## Structure

```
pti-calendar-design-system/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── ...
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── hooks/
│   ├── utils/
│   └── index.ts
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

---

## Build

```bash
pnpm build
```
