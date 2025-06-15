import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay } from "@/utils/effectUtils";

export default {
    card_name: "強欲な壺",
    card_type: "魔法" as const,
    text: "自分のデッキからカードを２枚ひく。ひいた後で強欲な壺を破壊する。",
    image: "card100016594_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                return new CardSelector(state).deck().len() >= 2;
            },
            effect: (state, card) => {
                for (let i = 0; i < 2; i++) {
                    withDelay(state, card, { delay: 20 * i }, (state) => {
                        sendCard(state, state.deck[0], "Hand");
                    });
                }
            },
        },
    },
} satisfies MagicCard;
