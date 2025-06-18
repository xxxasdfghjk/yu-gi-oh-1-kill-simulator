import type { MagicCard } from "@/types/card";
import { isMagicCard } from "@/utils/cardManagement";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

const card = {
    card_name: "テラ・フォーミング",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "①：デッキからフィールド魔法カード１枚を手札に加える。",
    image: "card73707637_1.jpg",
    effect: {
        onSpell: {
            condition: (state) =>
                state.deck.filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法").length > 0,
            effect: (state, card, _, resolve) =>
                withUserSelectCard(
                    state,
                    card,
                    (state) => state.deck.filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法"),
                    { select: "single", message: "デッキから手札に加えるフィールド魔法カードを選択してください" },
                    (state, card, selected) => {
                        sendCard(state, selected[0], "Hand");
                        resolve?.(state, card);
                    }
                ),
        },
    },
} satisfies MagicCard;

export default card;
