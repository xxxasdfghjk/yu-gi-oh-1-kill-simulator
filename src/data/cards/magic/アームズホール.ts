import type { MagicCard } from "@/types/card";
import { withUserSelectCard, withDelay } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "アームズ・ホール",
    card_type: "魔法" as const,
    text: "自分のデッキの一番上のカード１枚を墓地へ送って発動する。自分のデッキまたは墓地から装備魔法カード１枚を手札に加える。このカードを発動する場合、このターン自分はモンスターを通常召喚する事はできない。",
    image: "card73705497_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // デッキにカードが1枚以上必要
                return (
                    state.deck.length >= 1 &&
                    !state.hasNormalSummoned &&
                    new CardSelector(state).deck().graveyard().filter().equipSpell().get().length > 0
                );
            },
            payCost: (state, card, afterCallback) => {
                // デッキトップを墓地へ送る（コスト）
                if (state.deck.length > 0) {
                    const topCard = state.deck[state.deck.length - 1];
                    sendCard(state, topCard, "Graveyard");
                    // 通常召喚制限を適用
                    state.normalSummonProhibited = true;
                    withDelay(state, card, { delay: 100 }, (state, card) => {
                        afterCallback(state, card);
                    });
                }
            },
            effect: (state, card) => {
                // デッキと墓地から装備魔法カードを探す
                const equipSpells = (state: GameStore) =>
                    new CardSelector(state).deck().graveyard().filter().equipSpell().get();

                if (equipSpells.length > 0) {
                    withUserSelectCard(
                        state,
                        card,
                        equipSpells,
                        {
                            select: "single",
                            message: "手札に加える装備魔法カードを選択してください",
                            canCancel: false,
                        },
                        (state, _, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    );
                }
            },
        },
    },
} satisfies MagicCard;
