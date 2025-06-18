import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelayRecursive, withDraw, withSendToDeckTop } from "@/utils/effectUtils";
import { shuffleDeck } from "@/utils/gameUtils";

export default {
    card_name: "リロード",
    card_type: "魔法" as const,
    text: "自分の手札をデッキに加えてシャッフルする。その後、デッキに加えた枚数分のカードをドローする。",
    image: "card100006055_1.jpg",
    magic_type: "速攻魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return new CardSelector(state).hand().filter().excludeId(card.id).len() > 0;
            },
            effect: (state, card, _, resolve) => {
                // 遅延実行前に手札のIDを取得（プロキシオブジェクトではなくIDを保存）
                const handCardIds = new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();
                const handCount = handCardIds.length;
                withSendToDeckTop(state, card, handCardIds, (state, card) => {
                    // シャッフル
                    shuffleDeck(state);
                    // ドロー処理は遅延実行
                    withDraw(state, card, { count: handCount }, (state, card) => {
                        resolve?.(state, card);
                    });
                });
            },
        },
    },
} satisfies MagicCard;
