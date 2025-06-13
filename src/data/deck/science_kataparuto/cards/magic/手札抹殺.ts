import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay } from "@/utils/effectUtils";

export default {
    card_name: "手札抹殺",
    card_type: "魔法" as const,
    text: "お互いの手札を全て捨てた後、それぞれ自分のデッキから捨てた枚数分だけカードを引く。",
    image: "card100014788_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return new CardSelector(state).hand().filter().excludeId(card.id).len() > 0;
            },
            effect: (state, card) => {
                withDelay(state, card, { delay: 500 }, (state, card) => {
                    const handCard = new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();

                    handCard.forEach((card) => {
                        sendCard(state, card, "Graveyard");
                    });

                    // ドロー処理は遅延実行
                    for (let i = 0; i < handCard.length; i++) {
                        withDelay(state, card, { delay: 50 + i * 20, order: -1 }, (state) => {
                            sendCard(state, state.deck[0], "Hand");
                        });
                    }
                });
            },
        },
    },
} satisfies MagicCard;
