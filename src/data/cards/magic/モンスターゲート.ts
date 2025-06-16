import type { MagicCard } from "@/types/card";
import { releaseCard, sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withDelayRecursive,
    withNotification,
    withUserSummon,
    withDelay,
} from "@/utils/effectUtils";
import { monsterFilter } from "@/utils/cardManagement";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

export default {
    card_name: "モンスターゲート",
    card_type: "魔法" as const,
    text: "自分フィールド上のモンスター１体を生け贄に捧げる。通常召喚可能なモンスターが出るまで自分のデッキをめくり、そのモンスターを特殊召喚する。他のめくったカードは全て墓地に送る。",
    image: "card1000621_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore) => {
                return (
                    new CardSelector(state).allMonster().filter().nonNull().len() > 0 &&
                    new CardSelector(state).deck().filter().canNormalSummon().noSummonLimited().len() > 0
                );
            },
            payCost: (state: GameStore, card: CardInstance, after) => {
                withUserSelectCard(
                    state,
                    card,
                    (state: GameStore) => new CardSelector(state).allMonster().filter().nonNull().get(),
                    {
                        select: "single",
                        message: "リリースするモンスターを1体選んでください",
                    },
                    (state: GameStore, card: CardInstance, selected: CardInstance[]) => {
                        // 選択したモンスターをリリース
                        releaseCard(state, selected[0]);
                        withDelay(state, card, { delay: 100 }, (state, card) => {
                            after(state, card);
                        });
                    }
                );
            },
            effect: (state: GameStore, card: CardInstance) => {
                withDelay(state, card, {}, (state, card) => {
                    const deckCards = new CardSelector(state).deck().get();
                    const foundIndex = deckCards.findIndex(
                        (card) =>
                            card !== null &&
                            monsterFilter(card.card) &&
                            card.card.canNormalSummon === true &&
                            card.card.summonLimited !== true
                    );
                    if (foundIndex === -1) {
                        withNotification(state, card, {
                            message: `${card.card.card_name}の効果を発動できませんでした。`,
                        });
                        return;
                    }

                    withDelayRecursive(
                        state,
                        card,
                        { delay: 200 },
                        foundIndex + 1, // 見つかったモンスターを含む枚数
                        (state, card, depth) => {
                            const currentCard = state.deck[0]; // デッキの一番上のカード
                            if (depth === 1) {
                                withNotification(state, card, { message: "宣言が外れました。" }, (state, card) => {
                                    // 宣言が外れた場合、特殊召喚
                                    withUserSummon(state, card, state.deck[0], {}, () => {});
                                });
                            } else {
                                // 途中でめくったカードは墓地へ
                                sendCard(state, currentCard, "Graveyard");
                                state.deck[0].position = "attack";
                            }
                        }
                    );
                });
            },
        },
    },
} satisfies MagicCard;
