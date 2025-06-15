import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelayRecursive } from "@/utils/effectUtils";
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
            effect: (state, card) => {
                // 遅延実行前に手札のIDを取得（プロキシオブジェクトではなくIDを保存）
                const handCardIds = new CardSelector(state)
                    .hand()
                    .filter()
                    .excludeId(card.id)
                    .nonNull()
                    .get()
                    .map((c) => c.id);
                const handCount = handCardIds.length;
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    handCount,
                    (state, _card, depth) => {
                        const targetCard = state.hand.find((c) => c.id === handCardIds[depth - 1]);
                        if (targetCard) {
                            sendCard(state, targetCard, "Deck");
                        }
                    },
                    (state, card) => {
                        // シャッフル
                        shuffleDeck(state);
                        // ドロー処理は遅延実行
                        withDelayRecursive(state, card, { delay: 100 }, handCount, (state, _card, depth) => {
                            sendCard(state, state.deck[depth - 1], "Hand");
                        });
                    }
                );
            },
        },
    },
} satisfies MagicCard;
