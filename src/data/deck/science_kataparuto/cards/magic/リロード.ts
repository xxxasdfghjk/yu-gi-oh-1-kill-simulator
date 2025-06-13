import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withDelay } from "@/utils/effectUtils";
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
                withDelay(state, card, { delay: 500 }, (state, card) => {
                    // 遅延実行前に手札のIDを取得（プロキシオブジェクトではなくIDを保存）
                    const handCardIds = new CardSelector(state)
                        .hand()
                        .filter()
                        .excludeId(card.id)
                        .nonNull()
                        .get()
                        .map((c) => c.id);
                    const handCount = handCardIds.length;

                    // 手札をデッキに戻す処理を即座に実行
                    handCardIds.forEach((cardId) => {
                        const targetCard = state.hand.find((c) => c.id === cardId);
                        if (targetCard) {
                            sendCard(state, targetCard, "Deck");
                        }
                    });

                    // シャッフル
                    shuffleDeck(state);

                    // ドロー処理は遅延実行
                    for (let i = 0; i < handCount; i++) {
                        withDelay(state, card, { delay: 50 + i * 20, order: -1 }, (state) => {
                            sendCard(state, state.deck[0], "Hand");
                        });
                    }
                });
            },
        },
    },
} satisfies MagicCard;
