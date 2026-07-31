/**
 * Profile — one child profile (offline, local only).
 * Fields: name, avatar (emoji), age, favoriteColor, createdAt.
 */
import { uid } from '../util.js';

const AVATARS = ['🦁', '🐱', '🐰', '🐻', '🦊', '🐼', '🐨', '🐸', '🦄', '🐙', '🐧', '🐢'];

export default class Profile {
  constructor(props = {}) {
    this.id = props.id || uid('child');
    this.name = props.name || '';
    this.avatar = props.avatar || AVATARS[0];
    this.age = props.age ?? null;
    this.favoriteColor = props.favoriteColor || '#5b6bff';
    this.createdAt = props.createdAt || Date.now();
  }

  static avatars() { return [...AVATARS]; }

  static fromJSON(o) { return new Profile(o); }
  toJSON() {
    return { id: this.id, name: this.name, avatar: this.avatar, age: this.age, favoriteColor: this.favoriteColor, createdAt: this.createdAt };
  }
}
