import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay } from "@/utils/effectUtils";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "ハリケーン",
    card_type: "魔法" as const,
    text: "全フィールド上の魔法・罠カードを全て手札に戻す。",
    image: "card100002511_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return new CardSelector(state).allFieldSpellTrap().filter().nonNull().excludeId(card.id).len() > 0;
            },
            effect: (state, card) => {
                const targetListId = new CardSelector(state)
                    .allFieldSpellTrap()
                    .filter()
                    .nonNull()
                    .excludeId(card.id)
                    .get()
                    .map((e) => e.id);
                withDelay(state, card, { delay: 600, order: -1 }, (state, card) => {
                    for (let i = 0; i < targetListId.length; i++) {
                        withDelay(state, card, { delay: i * 40 }, (state) => {
                            const cardInstance = getCardInstanceFromId(state, targetListId[i])!;
                            sendCard(state, cardInstance, "Hand");
                        });
                    }
                });
            },
        },
    },
} satisfies MagicCard;
