import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withDraw } from "@/utils/effectUtils";

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
            effect: (state, card, _, resolve) => {
                withDraw(state, card, { count: 2 }, (state, card) => {
                    resolve?.(state, card);
                });
            },
        },
    },
} satisfies MagicCard;
