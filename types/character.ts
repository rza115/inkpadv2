/**
 * Character Types
 * Type definitions for character management
 */

export type CharacterRole = 'mc' | 'supporting' | 'antagonist' | 'other';

export interface Character {
  id: string;
  project_id: string;
  name: string;
  aliases: string | null;
  role: CharacterRole | null;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterData {
  name: string;
  aliases?: string | null;
  role?: CharacterRole | null;
  description?: string | null;
  image_url?: string | null;
}

export interface UpdateCharacterData {
  name?: string;
  aliases?: string | null;
  role?: CharacterRole | null;
  description?: string | null;
  image_url?: string | null;
}

export const ROLE_LABELS: Record<CharacterRole, string> = {
  mc: 'Protagonis',
  supporting: 'Pendukung',
  antagonist: 'Antagonis',
  other: 'Lainnya',
};