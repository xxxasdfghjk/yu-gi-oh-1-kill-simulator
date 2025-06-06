import type { Card, DeckData } from '@/types/card';
import cardsData from './cards.json';

export const loadDeckData = (): DeckData => {
  const deckData = cardsData as any;
  
  const mainDeck: Card[] = deckData.main_deck.map((card: any, index: number) => ({
    ...card,
    id: `main_${index}_${card.card_name}`,
  }));

  const extraDeck: Card[] = deckData.extra_deck.map((card: any, index: number) => ({
    ...card,
    id: `extra_${index}_${card.card_name}`,
  }));

  return {
    deck_name: deckData.deck_name,
    main_deck: mainDeck,
    extra_deck: extraDeck,
  };
};