/** Erreur portant un code HTTP : le dispatcher la renvoie telle quelle au client. */
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
