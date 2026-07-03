/**
 * CharacterCard Component
 * Displays a character card with photo, name, and role badge
 */
'use client';

import type { Character } from '@/types/character';
import { ROLE_LABELS } from '@/types/character';

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

export function CharacterCard({ character, onClick }: CharacterCardProps) {
  return (
    <div className="character-card" onClick={onClick}>
      <div 
        className={`character-photo ${character.image_url ? '' : 'no-photo'}`}
        style={character.image_url ? { backgroundImage: `url('${character.image_url}')` } : undefined}
      >
        {!character.image_url && <i className="ti ti-user" aria-hidden="true"></i>}
      </div>
      <p className="character-name">{character.name}</p>
      {character.role && (
        <span className="badge">{ROLE_LABELS[character.role]}</span>
      )}
    </div>
  );
}

interface NewCharacterCardProps {
  onClick: () => void;
}

export function NewCharacterCard({ onClick }: NewCharacterCardProps) {
  return (
    <div className="character-card new-card" onClick={onClick}>
      <i className="ti ti-user-plus" aria-hidden="true"></i>
      <span>Karakter baru</span>
    </div>
  );
}