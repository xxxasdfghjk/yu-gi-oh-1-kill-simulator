import type { Card } from "@/types/card";

export type Rule = "start_six_hand";
export type Deck = {
    deck_name: string;
    main_deck: Card[];
    extra_deck: Card[];
    token: Card[];
    rules: Rule[];
};

export const expandDeckList = (
    deckList: { card_name: string; quantity: number }[],
    allCardsMap: Record<string, Card>
): Card[] => {
    const result: Card[] = [];

    for (const entry of deckList) {
        const card = allCardsMap[entry.card_name];
        if (!card) {
            continue;
        }

        // Add the card multiple times based on quantity
        for (let i = 0; i < entry.quantity; i++) {
            result.push(card);
        }
    }

    return result;
};
