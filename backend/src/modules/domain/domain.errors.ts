export class DuplicateHeroNameError extends Error {
  constructor() {
    super('Hero name already exists.');
    this.name = 'DuplicateHeroNameError';
  }
}

export class HeroHasMissionsError extends Error {
  constructor() {
    super('Hero has related missions.');
    this.name = 'HeroHasMissionsError';
  }
}

export class HeroReferenceNotFoundError extends Error {
  constructor() {
    super('Referenced hero does not exist.');
    this.name = 'HeroReferenceNotFoundError';
  }
}
