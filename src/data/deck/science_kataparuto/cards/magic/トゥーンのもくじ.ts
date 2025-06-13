import type { GameStore } from "@/store/gameStore";
import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "トゥーンのもくじ",
    card_type: "魔法" as const,
    text: "カード名に「トゥーン」の文字が入っているカードをデッキから１枚手札に加える。",
    image: "card100002568_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                return new CardSelector(state).deck().filter().include("トゥーン").len() > 0;
            },
            effect: (state, card) => {
                const list = (state: GameStore) => new CardSelector(state).deck().filter().include("トゥーン").get();
                withUserSelectCard(state, card, list, { select: "single" }, (state, card, selected) => {
                    sendCard(state, selected[0], "Hand");
                });
            },
        },
    },
} satisfies MagicCard;
