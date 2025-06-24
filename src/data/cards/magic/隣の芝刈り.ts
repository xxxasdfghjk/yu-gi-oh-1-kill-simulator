import { withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { MagicCard } from "@/types/card";

export default {
    card_name: "隣の芝刈り",
    card_type: "魔法" as const,
    text: "①：自分のデッキの枚数が相手よりも多い場合に発動できる。 デッキの枚数が相手と同じになるように、自分のデッキの上からカードを墓地へ送る。",
    image: "card100041211_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // 相手デッキが存在しないので、固定値40と比較（簡略化）
                return state.deck.length > 40;
            },
            effect: (state, card, _context, resolve) => {
                const opponentDeckCount = 40; // 相手デッキの枚数を40と仮定（簡略化）
                const cardsToSend = state.deck.length - opponentDeckCount;

                if (cardsToSend > 0) {
                    withDelayRecursive(
                        state,
                        card,
                        { delay: 50 }, // 大量のカードを送るので短い間隔
                        cardsToSend,
                        (state) => {
                            if (state.deck.length > 0) {
                                sendCard(state, state.deck[0], "Graveyard");
                            }
                        },
                        (state, card) => {
                            if (resolve) resolve(state, card);
                        }
                    );
                } else {
                    if (resolve) resolve(state, card);
                }
            },
        },
    },
} satisfies MagicCard;
