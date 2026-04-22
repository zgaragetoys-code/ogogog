import type { AvatarStyle } from "@/types/database";

export function avatarUrl(style: AvatarStyle, seed: string): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
