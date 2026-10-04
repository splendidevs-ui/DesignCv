/* Client HTTP de l'API — lève une Error portant le message renvoyé par le serveur. */

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new Error('Serveur injoignable. Vérifiez que l’application est bien démarrée.');
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(payload.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const api = {
  register: (data) => request('POST', '/api/auth/register', data),
  login: (data) => request('POST', '/api/auth/login', data),
  logout: () => request('POST', '/api/auth/logout', {}),
  me: () => request('GET', '/api/auth/me'),

  // Banc d'essai — TEMPORAIRE (voir server/demo.js).
  demoAccounts: () => request('GET', '/api/demo-accounts'),

  listCvs: () => request('GET', '/api/cvs'),
  createCv: (data) => request('POST', '/api/cvs', data),
  getCv: (id) => request('GET', `/api/cvs/${id}`),
  updateCv: (id, patch) => request('PATCH', `/api/cvs/${id}`, patch),
  duplicateCv: (id) => request('POST', `/api/cvs/${id}/duplicate`, {}),
  deleteCv: (id) => request('DELETE', `/api/cvs/${id}`),

  templates: () => request('GET', '/api/templates'),

  adminTemplates: () => request('GET', '/api/admin/templates'),
  createTemplate: (data) => request('POST', '/api/admin/templates', data),
  updateTemplate: (id, patch) => request('PATCH', `/api/admin/templates/${id}`, patch),
  deleteTemplate: (id) => request('DELETE', `/api/admin/templates/${id}`),
  reorderTemplates: (ids) => request('POST', '/api/admin/templates/ordre', { ids }),

  pricing: () => request('GET', '/api/pricing'),
  cvAccess: (id) => request('GET', `/api/cvs/${id}/access`),
  checkout: (id, payload) => request('POST', `/api/cvs/${id}/checkout`, payload),
  confirmOrder: (reference, code) => request('POST', `/api/orders/${reference}/confirm`, { code }),
  listOrders: () => request('GET', '/api/orders'),

  // Le PDF ne passe pas par `request` : c'est du binaire, et le nom du
  // fichier vient de l'en-tête. Voir downloadPdf() dans cv/render.js.
};
