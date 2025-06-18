import type { MagicCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

const card = {
    card_name: "おろかな埋葬",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "①：デッキからモンスター１体を墓地へ送る。",
    image: "card100024670_1.jpg",
    effect: {
        onSpell: {
            condition: (state) => state.deck.filter((e) => monsterFilter(e.card)).length > 0,
            effect: (state, card, _, resolve) =>
                withUserSelectCard(
                    state,
                    card,
                    (state) => state.deck.filter((e) => monsterFilter(e.card)),
                    { select: "single", message: "デッキから墓地に送るモンスターを選択してください" },
                    (state, card, selected) => {
                        sendCard(state, selected[0], "Graveyard");
                        resolve?.(state, card);
                    }
                ),
        },
    },
} satisfies MagicCard;

export default card;
