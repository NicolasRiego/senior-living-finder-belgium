## Objectif

Remplacer l'autosave par une sauvegarde explicite dans l'éditeur de résidence partenaire, avec indicateurs visuels et garde de navigation pour les modifications non enregistrées.

## Approche

Centraliser la gestion de l'état "modifié / propre" dans un **contexte React partagé** (`WizardSaveContext`). Chaque étape s'enregistre auprès du contexte en exposant : son état "modifié", sa fonction de sauvegarde, et sa fonction de réinitialisation. La coquille `ResidenceEditor` gère ensuite de manière centralisée :

- Le bouton "Enregistrer les modifications" en bas de chaque étape
- Le point orange dans la barre latérale
- La modale d'avertissement à la navigation
- L'avertissement avant rechargement du navigateur

## Périmètre par étape

L'application a deux types d'étapes :

**Étapes "formulaire" (champs texte → 1 sauvegarde groupée)**
Conversion complète vers le nouveau modèle (suppression d'`useAutosave`, ajout d'enregistrement au contexte, sauvegarde explicite) :
- Étape 1 — Général
- Étape 2 — Adresse
- Étape 8 — Contact

**Étapes "opérationnelles" (chaque action = écriture immédiate déjà existante)**
Ces étapes contiennent de multiples sous-actions atomiques (ajouter une chambre, uploader une photo, supprimer un service, etc.) qui s'enregistrent déjà immédiatement en base. Elles s'inscrivent au contexte comme "jamais modifiées" — le bouton global reste désactivé avec un message *"Les modifications de cette étape sont enregistrées automatiquement à chaque action"*. C'est la seule façon raisonnable de ne pas casser les flux existants (suppression de services, toggle de disponibilité, upload de photos, etc.) ajoutés récemment :
- Étape 3 — Logements (déjà lecture seule)
- Étape 4 — Tarifs
- Étape 5 — Services
- Étape 6 — Activités
- Étape 7 — Photos
- Étape 9 — Validation

> ⚠️ Si tu souhaites vraiment imposer la sauvegarde explicite *aussi* aux étapes opérationnelles, c'est une réécriture en profondeur de chacune (suivi de diff par ligne, annulation, etc.) que je propose de traiter dans un second temps, étape par étape.

## Détails techniques

### Nouveau fichier : `src/modules/partner/WizardSaveContext.tsx`

```ts
type StepHandle = { isDirty: boolean; save: () => Promise<void>; reset: () => void };
type Ctx = {
  register: (key: string, handle: StepHandle) => () => void;
  dirtySteps: Set<string>;
  currentStep: string;
  setCurrentStep: (k: string) => void;
  saveCurrent: () => Promise<boolean>;
  guardNavigation: (next: () => void) => void;
};
```

Hook `useRegisterWizardStep(key, { isDirty, save, reset })` qui ré-enregistre à chaque changement de `isDirty`/`save`.

### `ResidenceEditor.tsx`

- Enveloppe dans `<WizardSaveProvider>`.
- Sidebar : point orange à droite du label si `dirtySteps.has(stepKey)`.
- Bouton **"Enregistrer les modifications"** affiché sous la zone d'étape, désactivé si l'étape courante n'est pas modifiée.
- Boutons Précédent/Suivant + clics sidebar → passent par `guardNavigation`.
- Modale `AlertDialog` à 3 boutons (Enregistrer / Ignorer / Rester).
- `window.beforeunload` actif tant que `dirtySteps.size > 0`.
- Suppression de `AutosaveBadge` (remplacé par un compteur "X modification(s) non enregistrée(s)" si pertinent).

### Étapes formulaire (Général / Adresse / Contact)

- Conserver `local` state, supprimer `useAutosave`.
- Calculer `isDirty` par comparaison `local` vs valeurs initiales (snapshot mémorisé via `useRef`).
- Exposer `save()` qui fait l'`update` Supabase, met à jour le snapshot, appelle `onChange(local)`.
- Exposer `reset()` qui ré-applique le snapshot.
- Toast succès/erreur géré centralement dans `saveCurrent` du contexte.

### Étapes opérationnelles

Une seule ligne en haut :
```tsx
useRegisterWizardStep("services", { isDirty: false, save: async () => {}, reset: () => {} });
```
Plus une note `text-muted-foreground` *"Chaque modification est enregistrée immédiatement."* sous le titre.

## Risques / points d'attention

- L'autosave existant dans Général/Adresse/Contact disparaît : un partenaire qui ferme l'onglet sans cliquer "Enregistrer" perdra ses changements (mitigation : `beforeunload` + modale).
- Les étapes opérationnelles continuent de sauvegarder à chaque action (comportement actuel). Le point orange n'apparaîtra pas pour elles.
- `useAutosave` reste dans le code (utilisé seulement par les étapes formulaire avant migration) — je le retire des 3 fichiers concernés mais ne supprime pas le fichier au cas où.

## Confirmation demandée

Avant d'implémenter : OK pour ce périmètre (sauvegarde explicite uniquement sur les 3 étapes formulaire, étapes opérationnelles restent en sauvegarde immédiate par action) ? Ou veux-tu que je convertisse aussi une étape opérationnelle spécifique en priorité ?
