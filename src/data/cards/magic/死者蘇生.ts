import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "死者蘇生",
    card_type: "魔法" as const,
    text: "相手か自分の墓場にあるモンスターを、自分のコントロールでフィールド上に出せる。",
    image: "card100002579_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => new CardSelector(state).graveyard().filter().monster().noSummonLimited().len() > 0,
            effect: (state, card, _, resolve) => {
                const cardId = card.id;
                return withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).graveyard().filter().monster().noSummonLimited().get(),
                    { select: "single" },
                    (state, card, selected) => {
                        withUserSummon(state, card, selected[0], {}, (state) => {
                            resolve?.(state, getCardInstanceFromId(state, cardId)!);
                        });
                    }
                );
            },
        },
    },
} satisfies MagicCard;
