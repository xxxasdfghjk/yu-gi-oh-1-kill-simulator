import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelayRecursive, withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "魔法石の採掘",
    card_type: "魔法" as const,
    text: "自分の手札を２枚捨てる事で、自分の墓地に存在する魔法カードを１枚手札に加える。",
    image: "card100024685_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                // Need at least 2 other cards in hand to discard (excluding this card)
                const handCardsCount = new CardSelector(state).hand().filter().excludeId(card.id).len();
                // Need at least 1 magic card in graveyard
                const magicInGraveyard = new CardSelector(state).graveyard().filter().magic().len();
                return handCardsCount >= 2 && magicInGraveyard > 0;
            },
            payCost: (state, card, after) => {
                withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).hand().getNonNull(),
                    {
                        select: "multi",
                        condition: (list) => list.length === 2,
                        message: "手札から墓地に送るカードを2枚選んでください",
                    },
                    (state, card, discardCards) => {
                        // Discard the selected cards using withDelayRecursive
                        withDelayRecursive(
                            state,
                            card,
                            { delay: 100, order: -1 },
                            discardCards.length,
                            (state, _card, depth) => {
                                sendCard(state, discardCards[depth - 1], "Graveyard");
                            },
                            (state, card) => {
                                after(state, card);
                            }
                        );
                    }
                );
            },
            effect: (state, card) => {
                // First, select 2 cards from hand to discard as cost
                withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).graveyard().filter().magic().get(),
                    {
                        select: "single",
                        message: "墓地から手札に加える魔法カードを1枚選んでください",
                    },
                    (state, _card, selected) => {
                        sendCard(state, selected[0], "Hand");
                    }
                );
            },
        },
    },
} satisfies MagicCard;
