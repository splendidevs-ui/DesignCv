/* =====================================================================
   Paiement du téléchargement — carte bancaire et paiement mobile.

   Le parcours tient en trois écrans : choix du moyen de paiement,
   confirmation par code (3-D Secure pour la carte, validation sur le
   téléphone pour le mobile money), puis reçu. Rien n'est décidé ici : la validation, le montant
   et l'octroi du droit de télécharger sont l'affaire du serveur. Ce
   fichier ne fait que présenter et transmettre.
   ===================================================================== */

import { h, mount, toast } from '../lib/dom.js';
import { api } from '../lib/api.js';

/* ------------------------------------------------------------------ cartes */

const BRANDS = [
  { id: 'visa', label: 'Visa', re: /^4/, color: '#1a1f71', groups: [4, 4, 4, 4], len: 16, cvc: 3 },
  { id: 'mastercard', label: 'Mastercard', re: /^(5[1-5]|2[2-9])/, color: '#eb001b', groups: [4, 4, 4, 4], len: 16, cvc: 3 },
  { id: 'amex', label: 'American Express', re: /^3[47]/, color: '#2e77bb', groups: [4, 6, 5], len: 15, cvc: 4 },
];

const digits = (v) => String(v ?? '').replace(/\D+/g, '');
const brandOf = (value) => BRANDS.find((b) => b.re.test(digits(value))) || null;

/** Découpe une suite de chiffres selon les groupes de la marque (4-4-4-4, 4-6-5…). */
function group(value, groups = [4, 4, 4, 4]) {
  const out = [];
  let i = 0;
  for (const size of groups) {
    if (i >= value.length) break;
    out.push(value.slice(i, i + size));
    i += size;
  }
  if (i < value.length) out.push(value.slice(i));
  return out.join(' ');
}

/* ------------------------------------------------------------------- tarif */

let pricingCache = null;

async function getPricing() {
  if (!pricingCache) pricingCache = (await api.pricing()).pricing;
  return pricingCache;
}

/**
 * S'assure que ce CV est payé avant de laisser produire le PDF.
 * Résout true si le téléchargement peut avoir lieu, false sinon.
 * Marque `cv.paid` au passage pour éviter un aller-retour au prochain export.
 */
export async function ensurePaid(cv) {
  if (cv.paid) return true;

  let access;
  try {
    access = await api.cvAccess(cv.id);
  } catch (err) {
    toast(err.message, 'err');
    return false;
  }

  if (access.paid) { cv.paid = true; return true; }

  const price = access.price || await getPricing();
  const ok = await paymentDialog(cv, price);
  if (ok) cv.paid = true;
  return ok;
}

/* ---------------------------------------------------------------- dialogue */

function paymentDialog(cv, price) {
  return new Promise((resolve) => {
    const state = {
      method: 'card', order: null, instruction: '', demoCode: '',
      country: null, operator: null, pickedOperator: false,
    };

    const close = (result) => {
      backdrop.remove();
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };

    const body = h('div.pay__body');

    const backdrop = h('div.modal-backdrop', {
      onclick: (e) => { if (e.target === backdrop) close(false); },
    },
      h('div.modal.pay', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Paiement du téléchargement' },
        h('div.pay__head',
          h('div',
            h('p.eyebrow', 'Téléchargement du PDF'),
            h('h3.modal__title', cv.title || 'Mon CV'),
          ),
          h('div.pay__price',
            h('span.pay__price-amount', price.label),
            h('span.tiny.dim', 'paiement unique'),
          ),
        ),
        body,
      ),
    );

    /* ------------------------------------------------ écran 1 : moyen de paiement */

    const alert = h('div.alert.hidden');
    const fail = (message) => { alert.textContent = message; alert.classList.remove('hidden'); };

    function methodStep() {
      alert.classList.add('hidden');

      const tab = (id, label, icon) => h('button.pay__tab', {
        type: 'button',
        class: state.method === id ? 'is-on' : null,
        onclick: () => { state.method = id; methodStep(); },
      }, h('span.pay__tab-ico', icon), label);

      const form = state.method === 'card' ? cardForm() : mobileForm();

      mount(body,
        h('div.pay__tabs',
          tab('card', 'Carte bancaire', '💳'),
          tab('mobile-money', 'Paiement mobile', '📱'),
        ),
        alert,
        form.node,
        h('div.pay__actions',
          h('button.btn', { type: 'button', onclick: () => close(false) }, 'Annuler'),
          form.submit,
        ),
        h('p.pay__legal', state.method === 'card'
          ? '🔒 Aucune donnée de carte n’est conservée : seuls la marque et les quatre derniers '
            + 'chiffres figurent sur votre reçu.'
          : '🔒 Votre numéro n’est conservé que masqué (+225 07••••••56), le temps de figurer '
            + 'sur votre reçu.'),
        price.mode === 'demo' ? h('p.pay__demo-note',
          'Mode démonstration — aucun montant n’est réellement prélevé.') : null,
      );

      form.focusFirst();
    }

    /* --- formulaire carte --- */

    function cardForm() {
      const numberInput = h('input.input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'cc-number',
        placeholder: '4242 4242 4242 4242', maxLength: 23, 'aria-label': 'Numéro de carte',
      });
      const holderInput = h('input.input', {
        type: 'text', autocomplete: 'cc-name', placeholder: 'IBRAHIM FOFANA',
        'aria-label': 'Nom du titulaire',
      });
      const expInput = h('input.input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'cc-exp',
        placeholder: 'MM/AA', maxLength: 5, 'aria-label': 'Date d’expiration',
      });
      const cvcInput = h('input.input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'cc-csc',
        placeholder: '123', maxLength: 4, 'aria-label': 'Cryptogramme',
      });

      const visualNumber = h('div.pay-card__number', '•••• •••• •••• ••••');
      const visualHolder = h('div.pay-card__value', 'NOM DU TITULAIRE');
      const visualExp = h('div.pay-card__value', 'MM/AA');
      const visualBrand = h('div.pay-card__brand', 'Carte');
      const visual = h('div.pay-card',
        h('div.pay-card__chip'),
        visualNumber,
        h('div.pay-card__row',
          h('div', h('div.pay-card__label', 'Titulaire'), visualHolder),
          h('div', h('div.pay-card__label', 'Expire'), visualExp),
        ),
        visualBrand,
      );

      const repaint = () => {
        const brand = brandOf(numberInput.value);
        const raw = digits(numberInput.value).slice(0, brand?.len ?? 19);
        const groups = brand?.groups ?? [4, 4, 4, 4];

        numberInput.value = group(raw, groups);
        cvcInput.maxLength = brand?.cvc ?? 4;

        visualNumber.textContent = group(raw.padEnd(brand?.len ?? 16, '•'), groups);
        visualHolder.textContent = holderInput.value.toUpperCase() || 'NOM DU TITULAIRE';
        visualExp.textContent = expInput.value || 'MM/AA';
        visualBrand.textContent = brand?.label ?? 'Carte';
        visual.style.setProperty('--card-tint', brand?.color ?? '#2b3040');
      };

      numberInput.oninput = repaint;
      holderInput.oninput = repaint;
      cvcInput.oninput = () => { cvcInput.value = digits(cvcInput.value); };
      expInput.oninput = () => {
        // On glisse la barre oblique dès le mois saisi, et on la retire si
        // l'utilisateur revient en arrière : la saisie reste réversible.
        const d = digits(expInput.value).slice(0, 4);
        expInput.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
        repaint();
      };

      const submit = h('button.btn.btn--primary', { type: 'button' }, `Payer ${price.label}`);
      submit.onclick = () => pay(submit, {
        method: 'card',
        card: {
          number: numberInput.value,
          holder: holderInput.value,
          exp: expInput.value,
          cvc: cvcInput.value,
        },
      });

      const node = h('div.pay__form',
        visual,
        h('div.field.span-2',
          h('label.field__label', 'Numéro de carte'), numberInput),
        h('div.field.span-2',
          h('label.field__label', 'Nom du titulaire'), holderInput),
        h('div.field', h('label.field__label', 'Expiration'), expInput),
        h('div.field', h('label.field__label', 'Cryptogramme'), cvcInput),
      );

      repaint();
      return { node, submit, focusFirst: () => numberInput.focus() };
    }

    /* --- formulaire paiement mobile --- */

    function mobileForm() {
      const countries = price.countries || [];
      let country = countries.find((c) => c.code === state.country) || countries[0] || { operators: [] };
      let operator = country.operators.find((o) => o.id === state.operator)?.id
        || country.operators[0]?.id;

      const select = h('select.select',
        countries.map((c) => h('option', { value: c.code, selected: c.code === country.code },
          `${c.label} (+${c.dial})`)));

      const grid = h('div.pay-ops', { role: 'radiogroup', 'aria-label': 'Opérateur' });
      const dial = h('span.pay__dial', `+${country.dial ?? ''}`);
      const phoneInput = h('input.input.pay__phone', {
        type: 'tel', inputmode: 'numeric', autocomplete: 'tel',
        placeholder: country.sample ?? '', 'aria-label': 'Numéro de téléphone',
      });

      const paintOps = () => {
        grid.replaceChildren(...country.operators.map((o) => h('button.pay-op', {
          type: 'button', role: 'radio', 'aria-checked': String(o.id === operator),
          class: o.id === operator ? 'is-on' : null,
          onclick: () => {
            operator = o.id;
            state.operator = o.id;
            state.pickedOperator = true;   // plus de suggestion automatique
            paintOps();
          },
        },
          h('span.pay-op__dot', { style: { background: o.color, color: o.ink || '#fff' } }),
          h('span.pay-op__name', o.label),
        )));
      };

      /** Numéro local, débarrassé de l'indicatif — même règle que le serveur. */
      const localOf = (raw) => {
        let d = digits(raw);
        if (d.startsWith('00')) d = d.slice(2);
        if (country.dial && d.startsWith(country.dial) && d.length > country.len) d = d.slice(country.dial.length);
        if (d.length === country.len + 1 && d.startsWith('0')) d = d.slice(1);
        return d;
      };

      /* Suggestion d'opérateur d'après le début du numéro. Purement
         indicative : elle s'arrête dès que l'utilisateur choisit lui-même,
         et les pays dont la répartition n'est pas connue n'en émettent pas. */
      const suggest = () => {
        if (state.pickedOperator) return;
        const local = localOf(phoneInput.value);
        if (local.length < 2) return;
        const match = country.operators.find((o) => o.prefixes?.some((pfx) => local.startsWith(pfx)));
        if (match && match.id !== operator) {
          operator = match.id;
          state.operator = match.id;
          paintOps();
        }
      };

      select.onchange = () => {
        country = countries.find((c) => c.code === select.value) || country;
        state.country = country.code;
        state.pickedOperator = false;
        operator = country.operators[0]?.id;
        state.operator = operator;
        dial.textContent = `+${country.dial}`;
        phoneInput.placeholder = country.sample ?? '';
        paintOps();
        suggest();
      };

      // On laisse l'utilisateur espacer son numéro comme il en a l'habitude :
      // on filtre seulement ce qui n'est ni chiffre ni espace.
      phoneInput.oninput = () => {
        phoneInput.value = phoneInput.value.replace(/[^\d\s]/g, '').slice(0, 18);
        suggest();
      };

      const submit = h('button.btn.btn--primary', { type: 'button' }, `Payer ${price.label}`);
      submit.onclick = () => pay(submit, {
        method: 'mobile-money',
        country: select.value,
        operator,
        phone: phoneInput.value,
      });

      const node = h('div.pay__form',
        h('div.pay-mm',
          h('span.pay-mm__ico', '📲'),
          h('div',
            h('p.strong', 'Paiement depuis votre compte mobile'),
            h('p.tiny.dim', 'Une demande de validation arrive sur votre téléphone, suivie d’un code à saisir.'),
          ),
        ),
        h('div.field.span-2', h('label.field__label', 'Pays'), select),
        h('div.field.span-2',
          h('label.field__label', 'Opérateur'),
          grid,
        ),
        h('div.field.span-2',
          h('label.field__label', 'Numéro de téléphone'),
          h('div.pay__phone-row', dial, phoneInput),
          h('p.field__help', 'Le numéro sur lequel votre compte de paiement mobile est ouvert.'),
        ),
      );

      state.country = country.code;
      state.operator = operator;
      paintOps();
      return { node, submit, focusFirst: () => phoneInput.focus() };
    }

    /* ---------------------------------------------- écran 2 : code de validation */

    async function pay(button, payload) {
      alert.classList.add('hidden');
      const label = button.textContent;
      button.disabled = true;
      button.textContent = 'Connexion au prestataire…';

      try {
        const res = await api.checkout(cv.id, payload);
        if (res.paid) return close(true);   // déjà réglé entre-temps
        state.order = res.order;
        state.instruction = res.instruction || '';
        state.demoCode = res.demoCode || '';
        codeStep();
      } catch (err) {
        fail(err.message);
        button.disabled = false;
        button.textContent = label;
      }
    }

    function codeStep() {
      const codeAlert = h('div.alert.hidden');
      const input = h('input.input.pay__code', {
        type: 'text', inputmode: 'numeric', maxLength: 6, autocomplete: 'one-time-code',
        placeholder: '••••••', 'aria-label': 'Code de confirmation',
      });
      input.oninput = () => { input.value = digits(input.value).slice(0, 6); };

      const confirm = h('button.btn.btn--primary', { type: 'button' }, 'Valider le paiement');
      confirm.onclick = async () => {
        codeAlert.classList.add('hidden');
        confirm.disabled = true;
        confirm.textContent = 'Vérification…';
        try {
          const res = await api.confirmOrder(state.order.reference, input.value);
          state.order = res.order;
          receiptStep();
        } catch (err) {
          codeAlert.textContent = err.message;
          codeAlert.classList.remove('hidden');
          confirm.disabled = false;
          confirm.textContent = 'Valider le paiement';
          // Commande annulée ou expirée : on renvoie au choix du moyen de paiement.
          // methodStep() repart d'un panneau vide : on réaffiche le motif après.
          if (err.status === 409) setTimeout(() => { methodStep(); fail(err.message); }, 1400);
          input.select();
        }
      };

      input.onkeydown = (e) => { if (e.key === 'Enter') confirm.click(); };

      mount(body,
        h('div.pay__step',
          h('div.pay__step-ico', state.order.method === 'card' ? '🔐' : '📲'),
          h('div',
            h('p.strong', state.order.method === 'card'
              ? 'Confirmation 3-D Secure'
              : 'Confirmation du paiement mobile'),
            h('p.tiny.dim', state.order.detail),
          ),
        ),
        h('p.muted.small', state.instruction),
        codeAlert,
        h('div.field',
          h('label.field__label', 'Code de confirmation'),
          input,
        ),
        state.demoCode ? h('div.pay__demo',
          h('span', 'Mode démonstration — code à saisir :'),
          h('b.pay__demo-code', state.demoCode),
        ) : null,
        h('div.pay__actions',
          h('button.btn', {
            type: 'button',
            onclick: () => { state.order = null; methodStep(); },
          }, '← Changer de moyen'),
          confirm,
        ),
        h('p.pay__legal', `Référence ${state.order.reference} · ${state.order.label}`),
      );

      input.focus();
    }

    /* --------------------------------------------------------- écran 3 : reçu */

    function receiptStep() {
      const line = (label, value) => h('div.pay__receipt-line',
        h('span.tiny.dim', label), h('span.strong', value));

      mount(body,
        h('div.pay__success',
          h('div.pay__success-ico', '✓'),
          h('h4', 'Paiement accepté'),
          h('p.tiny.dim', 'Votre CV est débloqué : vous pouvez le télécharger autant de fois que nécessaire.'),
        ),
        h('div.pay__receipt',
          line('Référence', state.order.reference),
          line('Moyen de paiement', state.order.detail),
          line('Montant', state.order.label),
          line('Date', new Date(state.order.paidAt || Date.now()).toLocaleString('fr-FR')),
        ),
        h('div.pay__actions',
          h('button.btn.btn--primary.btn--block', {
            type: 'button', onclick: () => close(true),
          }, '⬇ Télécharger le PDF'),
        ),
      );
    }

    document.body.append(backdrop);
    document.addEventListener('keydown', onKey);
    methodStep();
  });
}
