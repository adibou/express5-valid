# express5-valid

Librairie de validation type-safe pour Express.js 5.0+

Compatible Node.js 18+

## Installation

```bash
npm install express5-valid express@^5.0.0
```

## Publication npm

Checklist minimale avant de publier :

```bash
npm whoami
npm run prepublishOnly
npm pack --dry-run
```

Publication :

```bash
npm version patch
npm publish
```

Si le nom du package est déjà pris sur npm, il faudra le renommer dans package.json avant publication.

## Configuration

```typescript
import express from 'express';
import { validMiddleware, validErrorHandler } from 'express5-valid';

const app = express();
app.use(express.json());
app.use(validMiddleware);  // Doit être ajouté avant les routes

// Vos routes ici

app.use(validErrorHandler);  // Le gestionnaire d'erreurs doit être en dernier
app.listen(3000);
```

### Utilisation avec JsonRouter (optionnel)

```typescript
import { createJsonRouter } from 'express5-valid';

const api = createJsonRouter();
api.post('/users', handler);
app.use(api.router);
```

---

## Types de Validation

### String

Accès : `body('field').string` ou `params('field').string`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.minLength(n)` | method | Longueur minimale |
| `.maxLength(n)` | method | Longueur maximale |
| `.pattern(regex)` | method | Validation par expression régulière |
| `.email` | getter | Valide le format email |
| `.url` | getter | Valide le format URL (http/https) |
| `.trim` | getter | Supprime les espaces |
| `.lowercase` | getter | Convertit en minuscules |
| `.uppercase` | getter | Convertit en majuscules |
| `.oneOf(values)` | method | Doit être dans la liste de valeurs |
| `.value` | getter | Extrait la valeur validée |

**Exemple :**
```typescript
const name = body('name').string.required.trim.minLength(2).maxLength(50).value;
const email = body('email').string.email.value;
```

---

### Number

Accès : `body('field').number` ou `params('field').number`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.min(n)` | method | Valeur minimale (inclusive) |
| `.max(n)` | method | Valeur maximale (inclusive) |
| `.between(min, max)` | method | Raccourci pour min et max |
| `.integer` | getter | Doit être un entier |
| `.positive` | getter | Doit être > 0 |
| `.negative` | getter | Doit être < 0 |
| `.oneOf(values)` | method | Doit être dans la liste de valeurs |
| `.value` | getter | Extrait la valeur validée |

**Exemple :**
```typescript
const age = body('age').number.required.positive.integer.between(1, 150).value;
const price = body('price').number.max(9999.99).value;
```

---

### Boolean

Accès : `body('field').boolean` ou `params('field').boolean`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.value` | getter | Extrait la valeur validée |

**Parsing :** Accepte boolean, 'true'/'false' (string), ou 1/0

**Exemple :**
```typescript
const active = body('active').boolean.required.value;
const isAdmin = body('isAdmin').boolean.default(false).value;
```

---

### Date

Accès : `body('field').date` ou `params('field').date`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.min(date)` | method | Doit être après cette date |
| `.max(date)` | method | Doit être avant cette date |
| `.past` | getter | Doit être dans le passé |
| `.future` | getter | Doit être dans le futur |
| `.value` | getter | Extrait la valeur validée |

**Parsing :** Accepte Date, string ISO, ou number (timestamp)

**Exemple :**
```typescript
const birthDate = body('birthDate').date.required.past.value;
const eventDate = body('eventDate').date.future.value;
```

---

### Array

Accès : `body('field').array` ou `params('field').array`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.minLength(n)` | method | Longueur minimale du tableau |
| `.maxLength(n)` | method | Longueur maximale du tableau |
| `.ofNumbers(config?)` | method | Valide un tableau de nombres |
| `.ofStrings(config?)` | method | Valide un tableau de strings |
| `.ofBooleans()` | method | Valide un tableau de booléens |
| `.ofObjects(validator)` | method | Valide un tableau d'objets |
| `.value` | getter | Extrait la valeur validée |

#### Options pour ofNumbers

| Option | Type | Description |
|--------|------|-------------|
| `min` | number | Valeur minimale par élément |
| `max` | number | Valeur maximale par élément |
| `integer` | boolean | Doit être des entiers |
| `positive` | boolean | Doit être > 0 |
| `negative` | boolean | Doit être < 0 |

#### Options pour ofStrings

| Option | Type | Description |
|--------|------|-------------|
| `minLength` | number | Longueur minimale par élément |
| `maxLength` | number | Longueur maximale par élément |
| `pattern` | RegExp | Regex par élément |
| `email` | boolean | Doit être des emails valides |
| `url` | boolean | Doit être des URLs valides |
| `trim` | boolean | Supprime les espaces par élément |

**Exemple :**
```typescript
const numbers = body('items').array.ofNumbers({ min: 1, max: 100 }).minLength(1).value;
const emails = body('emails').array.ofStrings({ email: true }).value;
const tags = body('tags').array.ofStrings({ minLength: 2, trim: true }).value;
```

---

### Enum

Accès : `body('field').enum(allowedValues)` ou `params('field').enum(allowedValues)`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.value` | getter | Extrait la valeur validée |

**Exemple :**
```typescript
const status = body('status').enum(['pending', 'approved', 'rejected']).required.value;
const priority = body('priority').enum([1, 2, 3, 4, 5]).value;
```

---

### Object

Accès : `body('field').object(validator)` ou `params('field').object(validator)`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `.required` | getter | Le champ est obligatoire |
| `.nullable` | getter | Autorise les valeurs null |
| `.default(value)` | method | Valeur par défaut si undefined |
| `.value` | getter | Extrait la valeur validée |

**Exemple :**
```typescript
import { validArgument } from 'express5-valid';

const profile = body('profile').object((obj) => {
    return {
        firstName: validArgument(obj, 'firstName').string.required.value,
        lastName: validArgument(obj, 'lastName').string.required.value,
        age: validArgument(obj, 'age').number.positive.value,
    };
}).required.value;
```

---

## Codes d'Erreur

| Code | Description | Types concernés |
|------|-------------|-----------------|
| `REQUIRED` | Champ manquant | Tous |
| `NOT_NULLABLE` | La valeur est null | Tous |
| `INVALID_TYPE` | Type de données incorrect | Tous |
| `MIN_LENGTH` | String trop courte | String |
| `MAX_LENGTH` | String trop longue | String |
| `MIN_VALUE` | Nombre en dessous du minimum | Number |
| `MAX_VALUE` | Nombre au dessus du maximum | Number |
| `NOT_INTEGER` | Nombre décimal fourni | Number |
| `NOT_POSITIVE` | N'est pas > 0 | Number |
| `NOT_NEGATIVE` | N'est pas < 0 | Number |
| `INVALID_EMAIL` | Format email invalide | String |
| `INVALID_URL` | Format URL invalide | String |
| `NOT_IN_LIST` | Valeur absente de la liste | String, Number, Enum |
| `PATTERN_MISMATCH` | Regex échouée | String |
| `ARRAY_MIN_LENGTH` | Tableau trop court | Array |
| `ARRAY_MAX_LENGTH` | Tableau trop long | Array |
| `ARRAY_ELEMENT` | Validation d'élément échouée | Array |
| `DATE_MIN` | Date avant le minimum | Date |
| `DATE_MAX` | Date après le maximum | Date |
| `DATE_NOT_PAST` | Date pas dans le passé | Date |
| `DATE_NOT_FUTURE` | Date pas dans le futur | Date |
| `INVALID_DATE` | Date non parsable | Date |

---

## Exemple Complet

```typescript
import express from 'express';
import { body, params, createJsonRouter, validMiddleware,
         validErrorHandler, validArgument } from 'express5-valid';

const app = express();
app.use(express.json());
app.use(validMiddleware);

const api = createJsonRouter();

api.post('/users', () => {
    const name = body('name').string.required.trim.minLength(2).value;
    const email = body('email').string.email.value;
    const age = body('age').number.positive.integer.value;
    const roles = body('roles').array.ofStrings().value;

    return { name, email, age, roles };
});

api.get('/users/:id', () => {
    const id = params('id').number.required.positive.value;
    return { id };
});

app.use(api.router);
app.use(validErrorHandler);

app.listen(3000);
```
