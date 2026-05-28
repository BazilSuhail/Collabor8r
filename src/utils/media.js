// Preset avatars and project themes live in public/avatars and public/themes.
// The server stores only the file name (for example "3.jpg"). The client builds the path.
export const AVATAR_KEYS = Array.from({ length: 12 }, (_, i) => `${i + 1}.jpg`);
export const THEME_KEYS = Array.from({ length: 7 }, (_, i) => `${i + 1}.jpg`);

const isKey = (key, list) => typeof key === "string" && list.includes(key);

export const avatarPath = (key) => (isKey(key, AVATAR_KEYS) ? `/avatars/${key}` : null);
export const themePath = (key) => (isKey(key, THEME_KEYS) ? `/themes/${key}` : null);

// Preset avatar first, then an uploaded URL, then null (the initials fallback).
export const userAvatarSrc = (user) => avatarPath(user?.avatarKey) ?? user?.avatarUrl ?? null;
