const CATEGORY_KEYWORDS = {
  Alimentacion: [
    'alimentacion',
    'alimento',
    'alimentos',
    'comida',
    'comidas',
    'taco',
    'tacos',
    'pizza',
    'hamburguesa',
    'restaurante',
    'desayuno',
    'almuerzo',
    'cena',
  ],
  Bebidas: [
    'bebida',
    'bebidas',
    'refresco',
    'gaseosa',
    'soda',
    'jugo',
    'zumo',
    'cafe',
    'te',
    'cerveza',
    'cervezas',
    'botella de agua',
    'agua mineral',
    'agua',
  ],
  Transporte: [
    'transporte',
    'uber',
    'didi',
    'cabify',
    'taxi',
    'camion',
    'pasaje',
    'metro',
    'autobus',
    'tren',
    'gasolina',
  ],
  Entretenimiento: [
    'entretenimiento',
    'cine',
    'bar',
    'netflix',
    'spotify',
    'steam',
    'juego',
    'videojuego',
    'concierto',
    'fiesta',
  ],
  Servicios: [
    'servicios',
    'luz',
    'internet',
    'renta',
    'telefono',
    'gas',
    'recibo de agua',
    'pago de agua',
    'servicio de agua',
  ],
  Salud: ['salud', 'medicina', 'doctor', 'hospital', 'farmacia'],
  Vivienda: ['vivienda', 'hogar', 'casa', 'departamento'],
  Educacion: ['educacion', 'escuela', 'curso', 'colegiatura', 'universidad'],
  Ahorro: ['ahorro', 'ahorrar', 'inversion'],
  Deudas: ['deuda', 'deudas', 'prestamo', 'credito'],
  Suscripciones: ['suscripcion', 'suscripciones', 'membresia', 'membresias'],
};

const CANONICAL_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);
const CATEGORY_ALIASES = {
  comida: 'Alimentacion',
  alimentos: 'Alimentacion',
  'comida y bebida': 'Alimentacion',
  'comida y bebidas': 'Alimentacion',
  'alimentacion y bebidas': 'Alimentacion',
  bebida: 'Bebidas',
  bebidas: 'Bebidas',
  transporte: 'Transporte',
  servicios: 'Servicios',
  salud: 'Salud',
  vivienda: 'Vivienda',
  entretenimiento: 'Entretenimiento',
  educacion: 'Educacion',
  ahorro: 'Ahorro',
  deudas: 'Deudas',
  suscripcion: 'Suscripciones',
  suscripciones: 'Suscripciones',
  otro: 'Otros',
  otros: 'Otros',
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeywordMatch(normalizedText, keyword) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) {
    return false;
  }

  if (normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword);
  }

  const keywordRegex = new RegExp(`\\b${escapeRegExp(normalizedKeyword)}\\b`);
  return keywordRegex.test(normalizedText);
}

function toTitleCase(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function inferCategoryFromText(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return '';
  }

  // Handle ambiguous "agua" first.
  if (
    normalized.includes('recibo de agua')
    || normalized.includes('pago de agua')
    || normalized.includes('servicio de agua')
    || /\b(pague|pago|recibo|servicio)\s+agua\b/.test(normalized)
  ) {
    return 'Servicios';
  }

  for (const category of CANONICAL_CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category];
    const matched = keywords.some((keyword) => hasKeywordMatch(normalized, keyword));
    if (matched) {
      return category;
    }
  }

  return '';
}

function normalizeCategory(category, contextText = '') {
  const raw = String(category || '').trim();
  const normalizedCategory = normalizeText(raw);

  if (!normalizedCategory) {
    const inferred = inferCategoryFromText(contextText);
    return inferred || 'Otros';
  }

  const aliasCategory = CATEGORY_ALIASES[normalizedCategory];
  if (aliasCategory) {
    return aliasCategory;
  }

  for (const canonical of CANONICAL_CATEGORIES) {
    if (normalizedCategory === normalizeText(canonical)) {
      return canonical;
    }

    const keywords = CATEGORY_KEYWORDS[canonical];
    const matched = keywords.some((keyword) => normalizedCategory === normalizeText(keyword));
    if (matched) {
      return canonical;
    }
  }

  return toTitleCase(raw);
}

module.exports = {
  normalizeText,
  inferCategoryFromText,
  normalizeCategory,
};
