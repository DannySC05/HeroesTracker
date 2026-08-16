export class DuplicateEmailError extends Error {
  constructor() {
    super('El email ya está registrado.');
    this.name = 'DuplicateEmailError';
  }
}
