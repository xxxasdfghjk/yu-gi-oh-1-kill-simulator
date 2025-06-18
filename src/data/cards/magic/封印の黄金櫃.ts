import type { MagicCard } from "@/types/card";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";

export default {
    card_name: "封印の黄金櫃",
    card_type: "魔法" as const,
    text: "自分のデッキからカードを１枚選択し、ゲームから除外する。発動後２回目の自分のスタンバイフェイズ時にそのカードを手札に加える。",
    image: "card100019307_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // デッキにカードが1枚以上必要
                return state.deck.length >= 1;
            },
            effect: (state, card, _, resolve) => {
                // デッキからカードを選択
                withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).deck().getNonNull(),
                    {
                        select: "single",
                        message: "除外するカードを選択してください",
                        canCancel: false,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            // 選択したカードを除外
                            sendCard(state, selected[0], "Exclusion");
                        }
                        resolve?.(state, card);
                    }
                );
            },
        },
    },
} satisfies MagicCard;
