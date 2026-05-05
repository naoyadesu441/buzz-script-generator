'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { GenerationInput, Genre, Tone } from '@/lib/persona/types';

interface DiagnoseState {
  genre: Genre | string;
  position: string;
  targetHint: string;
  productDirection: string;
  referenceUrls: string[];
  tone: Tone;
  setGenre: (v: Genre | string) => void;
  setPosition: (v: string) => void;
  setTargetHint: (v: string) => void;
  setProductDirection: (v: string) => void;
  setReferenceUrls: (v: string[]) => void;
  setTone: (v: Tone) => void;
  toInput: () => GenerationInput;
}

const DiagnoseContext = createContext<DiagnoseState | null>(null);

export function DiagnoseProvider({ children }: { children: ReactNode }) {
  const [genre, setGenre] = useState<Genre | string>('副業全般');
  const [position, setPosition] = useState('');
  const [targetHint, setTargetHint] = useState('');
  const [productDirection, setProductDirection] = useState('');
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [tone, setTone] = useState<Tone>('丁寧');

  const toInput = (): GenerationInput => ({
    genre,
    position: position || undefined,
    targetHint: targetHint || undefined,
    productDirection: productDirection || undefined,
    referenceUrls: referenceUrls.filter(Boolean),
    tone,
  });

  return (
    <DiagnoseContext.Provider value={{
      genre, setGenre,
      position, setPosition,
      targetHint, setTargetHint,
      productDirection, setProductDirection,
      referenceUrls, setReferenceUrls,
      tone, setTone,
      toInput,
    }}>
      {children}
    </DiagnoseContext.Provider>
  );
}

export function useDiagnose() {
  const ctx = useContext(DiagnoseContext);
  if (!ctx) throw new Error('useDiagnose must be used within DiagnoseProvider');
  return ctx;
}
