import type { Avatar } from '@/game/storage';

export interface ChildProfile {
  name: string;
  age: number;
  avatar: Avatar;
}

const PROFILE_KEY = 'playkids:child-profile:v1';

export function loadProfile(): ChildProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ChildProfile>;
    if (typeof value.name !== 'string' || !value.name.trim() || typeof value.age !== 'number' || value.age < 3 || value.age > 7) return null;
    return { name: value.name.trim().slice(0, 24), age: value.age, avatar: value.avatar === 'girl' ? 'girl' : 'boy' };
  } catch {
    return null;
  }
}

export function storeProfile(profile: ChildProfile | null): boolean {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    else localStorage.removeItem(PROFILE_KEY);
    return true;
  } catch {
    return false;
  }
}