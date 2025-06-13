import type { Deck } from "../deckUtils";

const deckList = import.meta.glob("./*/deck.ts", { eager: true }) as Record<string, { default: Deck }>;

export default Object.values(deckList);
