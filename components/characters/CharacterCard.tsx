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
    <div 
      className="bg-surface border border-default rounded-[var(--radius-lg)] p-4 cursor-pointer flex flex-col items-center text-center gap-2 transition-colors hover:border-accent"
      onClick={onClick}
    >
      <div 
        className="w-[72px] h-[72px] rounded-full bg-surface-raised bg-cover bg-center flex items-center justify-center text-muted text-2xl"
        style={character.image_url ? { backgroundImage: `url('${character.image_url}')` } : undefined}
      >
        {!character.image_url && <i className="ti ti-user" aria-hidden="true"></i>}
      </div>
      <p className="font-serif text-sm font-semibold m-0">{character.name}</p>
      {character.role && (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-muted">
          {ROLE_LABELS[character.role]}
        </span>
      )}
    </div>
  );
}

interface NewCharacterCardProps {
  onClick: () => void;
}

export function NewCharacterCard({ onClick }: NewCharacterCardProps) {
  return (
    <div 
      className="bg-surface border border-dashed border-default rounded-[var(--radius-lg)] cursor-pointer flex flex-col items-center justify-center gap-2 text-muted min-h-[150px] text-sm transition-colors hover:border-accent"
      onClick={onClick}
    >
      <i className="ti ti-user-plus text-[22px]" aria-hidden="true"></i>
      <span>Karakter baru</span>
    </div>
  );
}
