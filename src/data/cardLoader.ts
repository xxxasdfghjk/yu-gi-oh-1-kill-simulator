import type { Card, DeckData } from "@/types/card";
import cardsData from "./cards.json";

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

export const getTokenCard = (tokenName: string): Card | null => {
    const deckData = cardsData;
    const token = deckData.token?.find((t: any) => t.card_name === tokenName);

    if (!token) return null;

    return {
        ...token,
        id: `token_${token.card_name}`,
    };
};
