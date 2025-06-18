import type { MagicCard } from "@/types/card";

export default {
    card_name: "魔力倹約術",
    card_type: "魔法" as const,
    text: "魔法カードを発動するために払うライフポイントが必要なくなる。",
    image: "card100001374_1.jpg",
    magic_type: "永続魔法" as const,
    effect: {
        onSpell: {
            condition: () => {
                return true;
            },
            effect: (state, card, _, resolve) => {
                resolve?.(state, card);
            },
        },
        onPayLifeCost: (_state, card, _targetCard, lifeCost) => {
            // 魔力倹約術がフィールドにある場合、ライフコストを0にする
            if (card.location === "SpellField" && card.position !== "back") {
                return 0;
            }
            return lifeCost;
        },
    },
} satisfies MagicCard;
