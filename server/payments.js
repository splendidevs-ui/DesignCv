/* =====================================================================
   Paiement du téléchargement PDF.

   Ce module ne contient que le tarif, la validation des moyens de
   paiement et l'adaptateur vers le prestataire. Il ne stocke jamais
   un numéro de carte : la validation renvoie la marque et les quatre
   derniers chiffres, rien d'autre ne ressort de cette fonction.

   Deux modes, choisis par la variable d'environnement PAYMENT_MODE :

     demo (défaut) — le simulateur intégré délivre lui-même le code de
                     confirmation. Aucun argent ne circule.
     live          — délègue à un vrai prestataire. Tant qu'aucun n'est
                     branché ci-dessous, le mode refuse d'encaisser
                     plutôt que de faire semblant.
   ===================================================================== */

import { randomInt } from 'node:crypto';
import { HttpError } from './errors.js';

export const MODE = process.env.PAYMENT_MODE === 'live' ? 'live' : 'demo';

export const PRICE = {
  amount: Number(process.env.CV_PRICE) || 2000,
  currency: process.env.CV_CURRENCY || 'XOF',
};

const CURRENCY_SUFFIX = { XOF: 'FCFA', XAF: 'FCFA', EUR: '€', USD: '$' };

export const formatAmount = (amount = PRICE.amount, currency = PRICE.currency) =>
  `${amount.toLocaleString('fr-FR')} ${CURRENCY_SUFFIX[currency] || currency}`;

const digitsOf = (v) => String(v ?? '').replace(/\D+/g, '');

/* ------------------------------------------------------------------- carte */

/** Somme de Luhn : élimine les numéros mal recopiés avant tout appel réseau. */
function luhn(num) {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return num.length > 0 && sum % 10 === 0;
}

// Pour ajouter un schéma local (GIM-UEMOA…), compléter ce tableau avec les
// plages BIN fournies par le prestataire — ne pas les deviner.
const BRANDS = [
  { id: 'visa', label: 'Visa', re: /^4/, lengths: [13, 16, 19], cvc: 3 },
  { id: 'mastercard', label: 'Mastercard', re: /^(5[1-5]|2[2-9])/, lengths: [16], cvc: 3 },
  { id: 'amex', label: 'American Express', re: /^3[47]/, lengths: [15], cvc: 4 },
];

export const brandOf = (number) =>
  BRANDS.find((b) => b.re.test(digitsOf(number))) || null;

/**
 * Contrôle une carte et n'en retient que ce qui peut être conservé.
 * Lève une HttpError 400 sur la première anomalie rencontrée.
 */
export function validateCard(card = {}) {
  const number = digitsOf(card.number);
  const cvc = digitsOf(card.cvc);
  const holder = String(card.holder ?? '').trim().replace(/\s+/g, ' ');
  const exp = String(card.exp ?? '').trim();

  if (!holder) throw new HttpError(400, 'Indiquez le nom inscrit sur la carte.');
  if (holder.length > 60) throw new HttpError(400, 'Nom du titulaire trop long.');
  if (number.length < 12) throw new HttpError(400, 'Numéro de carte incomplet.');

  const brand = brandOf(number);
  if (!brand) throw new HttpError(400, 'Ce type de carte n’est pas accepté (Visa, Mastercard ou American Express).');
  if (!brand.lengths.includes(number.length)) {
    throw new HttpError(400, `Un numéro ${brand.label} compte ${brand.lengths.join(' ou ')} chiffres.`);
  }
  if (!luhn(number)) throw new HttpError(400, 'Numéro de carte invalide — vérifiez votre saisie.');
  if (cvc.length !== brand.cvc) {
    throw new HttpError(400, `Le cryptogramme d’une carte ${brand.label} compte ${brand.cvc} chiffres.`);
  }

  const m = /^(\d{2})\s*[/-]?\s*(\d{2}|\d{4})$/.exec(exp);
  if (!m) throw new HttpError(400, 'Date d’expiration attendue au format MM/AA.');

  const month = Number(m[1]);
  const year = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  if (month < 1 || month > 12) throw new HttpError(400, 'Mois d’expiration invalide.');

  const nowDate = new Date();
  const lastDay = new Date(year, month, 0, 23, 59, 59); // dernier jour du mois d'expiration
  if (lastDay < nowDate) throw new HttpError(400, 'Cette carte est expirée.');
  if (year > nowDate.getFullYear() + 20) throw new HttpError(400, 'Date d’expiration invalide.');

  return {
    brand: brand.id,
    brandLabel: brand.label,
    last4: number.slice(-4),
    expMonth: month,
    expYear: year,
    holder,
    // Conservé uniquement pour le simulateur ; jamais écrit en base.
    _number: number,
  };
}

/* ------------------------------------------------------- paiement mobile */

/*
 * Opérateurs de paiement mobile, par pays.
 *
 * `prefixes` ne sert qu'à *proposer* l'opérateur pendant la saisie : ce n'est
 * jamais un critère de rejet. Les plages de numéros bougent (la Côte d'Ivoire
 * est passée à dix chiffres en 2021, le Sénégal ouvre régulièrement de
 * nouvelles séries) et un tableau périmé bloquerait des clients légitimes.
 * Laisser le tableau vide quand la répartition n'est pas connue avec
 * certitude : l'utilisateur choisit alors lui-même son opérateur.
 */
const OPERATOR = {
  orange: { id: 'orange', label: 'Orange Money', color: '#ff7900' },
  mtn: { id: 'mtn', label: 'MTN MoMo', color: '#ffcc00', ink: '#1c1c1c' },
  moov: { id: 'moov', label: 'Moov Money', color: '#0a4ea2' },
  wave: { id: 'wave', label: 'Wave', color: '#12b3e3' },
  airtel: { id: 'airtel', label: 'Airtel Money', color: '#e40000' },
  free: { id: 'free', label: 'Free Money', color: '#e2001a' },
  emoney: { id: 'emoney', label: 'E-Money', color: '#f47b20' },
  mpesa: { id: 'mpesa', label: 'M-Pesa', color: '#1aa64b' },
  mvola: { id: 'mvola', label: 'MVola', color: '#f5a623', ink: '#1c1c1c' },
};

const op = (key, prefixes = []) => ({ ...OPERATOR[key], prefixes });

export const MOBILE_COUNTRIES = [
  { code: 'CI', dial: '225', label: 'Côte d’Ivoire', len: 10, sample: '07 07 12 34 56',
    operators: [op('orange', ['07']), op('mtn', ['05']), op('moov', ['01']), op('wave')] },
  { code: 'SN', dial: '221', label: 'Sénégal', len: 9, sample: '77 123 45 67',
    operators: [op('orange', ['77', '78']), op('free', ['76']), op('wave'), op('emoney', ['70'])] },
  { code: 'ML', dial: '223', label: 'Mali', len: 8, sample: '70 12 34 56',
    operators: [op('orange'), op('moov'), op('wave')] },
  { code: 'BF', dial: '226', label: 'Burkina Faso', len: 8, sample: '70 12 34 56',
    operators: [op('orange'), op('moov'), op('wave')] },
  { code: 'NE', dial: '227', label: 'Niger', len: 8, sample: '90 12 34 56',
    operators: [op('airtel'), op('moov')] },
  { code: 'GN', dial: '224', label: 'Guinée', len: 9, sample: '622 12 34 56',
    operators: [op('orange'), op('mtn')] },
  { code: 'CM', dial: '237', label: 'Cameroun', len: 9, sample: '699 12 34 56',
    operators: [op('mtn'), op('orange')] },
  { code: 'CD', dial: '243', label: 'RD Congo', len: 9, sample: '89 123 45 67',
    operators: [op('mpesa'), op('orange'), op('airtel')] },
  { code: 'MG', dial: '261', label: 'Madagascar', len: 9, sample: '32 12 345 67',
    operators: [op('mvola'), op('orange'), op('airtel')] },
];

/** Ne laisse visibles que les deux premiers et les deux derniers chiffres. */
const maskPhone = (dial, local) =>
  `+${dial} ${local.slice(0, 2)}${'•'.repeat(Math.max(0, local.length - 4))}${local.slice(-2)}`;

export function validateMobile({ country, operator, phone } = {}) {
  const entry = MOBILE_COUNTRIES.find((c) => c.code === String(country ?? '').toUpperCase());
  if (!entry) throw new HttpError(400, 'Choisissez le pays de votre compte mobile.');

  const carrier = entry.operators.find((o) => o.id === String(operator ?? ''));
  if (!carrier) {
    throw new HttpError(400, `Choisissez votre opérateur : ${entry.operators.map((o) => o.label).join(', ')}.`);
  }

  // On accepte les formes 00225…, +225…, 225… et le numéro local seul.
  // Attention : en Côte d'Ivoire le 0 initial fait partie du numéro, on ne le
  // retire donc que s'il rend le numéro trop long d'un chiffre.
  let local = digitsOf(phone);
  if (local.startsWith('00')) local = local.slice(2);
  if (local.startsWith(entry.dial) && local.length > entry.len) local = local.slice(entry.dial.length);
  if (local.length === entry.len + 1 && local.startsWith('0')) local = local.slice(1);

  if (!local) throw new HttpError(400, `Indiquez votre numéro ${carrier.label}.`);
  if (local.length !== entry.len) {
    throw new HttpError(400, `Un numéro ${entry.label} compte ${entry.len} chiffres.`);
  }

  return {
    country: entry.code,
    countryLabel: entry.label,
    operator: carrier.id,
    operatorLabel: carrier.label,
    e164: `+${entry.dial}${local}`,
    masked: maskPhone(entry.dial, local),
    _local: local,
  };
}

/* ------------------------------------------------------------ prestataire */

/**
 * Adaptateur vers le prestataire de paiement.
 *
 * `authorize` prépare l'encaissement et renvoie le défi à relever par le
 * porteur (3-D Secure pour la carte, validation sur le téléphone pour le
 * paiement mobile).
 * `confirm` vérifie ce défi et débloque le téléchargement.
 *
 * Pour brancher un vrai prestataire (CinetPay, PayDunya, Stripe, les API
 * opérateurs…) :
 * remplacer le corps de `live` par les appels HTTP correspondants, et
 * ajouter une route webhook qui passe la commande à « paid ».
 */
const demo = {
  authorize({ method, card, phone }) {
    if (method === 'card') {
      // Numéro de test refusé, pour éprouver le parcours d'échec.
      if (card._number === '4000000000000002') {
        throw new HttpError(402, 'Carte refusée par la banque émettrice.');
      }
      return {
        challenge: '3ds',
        otp: String(randomInt(100000, 1000000)),
        instruction: `Un code de validation à 6 chiffres a été envoyé par votre banque pour confirmer le paiement de ${formatAmount()}.`,
      };
    }

    // Numéro de test refusé, pour éprouver le parcours d'échec.
    if (phone._local.endsWith('00')) {
      throw new HttpError(402, `Solde ${phone.operatorLabel} insuffisant pour cette opération.`);
    }
    // Le canal exact — invite USSD poussée, SMS, notification dans
    // l'application — dépend du prestataire retenu. On reste donc sur une
    // formulation vraie pour tous plutôt que d'annoncer un code USSD qui
    // varie d'un opérateur et d'un pays à l'autre.
    return {
      challenge: 'push',
      otp: String(randomInt(100000, 1000000)),
      instruction: phone.operator === 'wave'
        ? `Confirmez le paiement de ${formatAmount()} dans l’application Wave, puis saisissez le code reçu.`
        : `Une demande de paiement de ${formatAmount()} a été envoyée au ${phone.masked} `
          + `(${phone.operatorLabel}). Validez-la sur votre téléphone, puis saisissez le code reçu.`,
    };
  },

  confirm(order, code) {
    return code === order.otp;
  },
};

const live = {
  authorize() {
    throw new HttpError(503,
      'Aucun prestataire de paiement n’est configuré. Renseignez-en un dans server/payments.js '
      + 'ou repassez PAYMENT_MODE sur « demo ».');
  },
  confirm() { return false; },
};

export const provider = MODE === 'demo' ? demo : live;

/** Ce que le client a le droit de connaître du paramétrage. */
export const pricing = () => ({
  amount: PRICE.amount,
  currency: PRICE.currency,
  label: formatAmount(),
  mode: MODE,
  countries: MOBILE_COUNTRIES.map(({ code, dial, label, sample, operators }) => ({
    code, dial, label, sample,
    operators: operators.map(({ id, label: name, color, ink, prefixes }) =>
      ({ id, label: name, color, ink, prefixes })),
  })),
});
