// 기본 덱. assets/data/cards.json 을 단일 출처로 한다 (36장, 6영역 × 6장).
import deckData from '../data/cards.json';
import type { FateCard } from './types';

interface DeckFile {
  version: number;
  cards: FateCard[];
}

const deck = deckData as DeckFile;

export const DECK_VERSION: number = deck.version ?? 1;
export const CARDS: FateCard[] = deck.cards;

export const cardById = (id: string): FateCard | undefined =>
  CARDS.find((c) => c.id === id);
