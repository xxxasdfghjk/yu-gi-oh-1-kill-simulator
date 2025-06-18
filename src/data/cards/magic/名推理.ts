import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSummon, withNotification, withDelayRecursive } from "@/utils/effectUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { getLevel } from "@/utils/gameUtils";

const getDecalaredLevel = (state: GameStore) => {
    const deckName = state.originDeck?.deck_name;
    switch (deckName) {
        case "サイエンカタパ": {
            const hasLevel5Monster = new CardSelector(state).allMonster().filter().level(5).len() > 0;
            const hasLevel1Monster = new CardSelector(state).allMonster().filter().level(1).len() > 0;
            if (hasLevel5Monster && hasLevel1Monster) {
                return Math.random() * 8 + 1;
            } else if (hasLevel5Monster) {
                return 1;
            } else {
                return 5;
            }
        }
        case "ドグマブレード": {
            const hasLevel8Monster = new CardSelector(state).allMonster().graveyard().filter().level(8).len() > 0;
            const hasLevel6Monster = new CardSelector(state).allMonster().graveyard().filter().level(6).len() > 0;
            if (!hasLevel8Monster) {
                return 8;
            }
            if (!hasLevel6Monster) {
                return 6;
            } else {
                return 1;
            }
            break;
        }
        default:
            return Math.random() * 8 + 1;
    }
};

export default {
    card_name: "名推理",
    card_type: "魔法" as const,
    text: "相手プレイヤーはモンスターのレベルを宣言する。通常召喚が可能なモンスターが出るまで自分のデッキからカードをめくる。出たモンスターが宣言されたレベルと同じ場合、めくったカードを全て墓地へ送る。違う場合、出たモンスターを特殊召喚し、残りのカードを墓地へ送る。",
    image: "card73707891_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore) => {
                return new CardSelector(state).deck().filter().canNormalSummon().len() > 0;
            },
            effect: (
                state: GameStore,
                card: CardInstance,
                _?: Record<string, string | number>,
                resolve?: (state: GameStore, card: CardInstance) => void
            ) => {
                // 相手の宣言レベルを決定
                const declaredLevel = getDecalaredLevel(state);

                withNotification(
                    state,
                    card,
                    {
                        message: `相手はレベル${declaredLevel}を宣言しました`,
                    },
                    (state, card) => {
                        // デッキから通常召喚可能なモンスターを探すまでのインデックスを取得
                        const deckCards = new CardSelector(state).deck().get();
                        const foundIndex = deckCards.findIndex(
                            (card) => card !== null && monsterFilter(card.card) && card.card.canNormalSummon === true
                        );

                        if (foundIndex === -1) {
                            withNotification(
                                state,
                                card,
                                {
                                    message: `${card.card.card_name}の効果を発動できませんでした。`,
                                },
                                () => {
                                    resolve?.(state, card);
                                }
                            );
                            return;
                        }
                        const foundMonster = deckCards[foundIndex]!;

                        const foundLevel = getLevel(foundMonster);
                        const isCorrectGuess = foundLevel === declaredLevel;
                        state.deck[0].position = "attack";

                        // めくったカードの処理（見つかったモンスターまで）
                        withDelayRecursive(
                            state,
                            card,
                            { delay: 200 },
                            foundIndex + 1,
                            (state, card, depth) => {
                                const currentCard = state.deck[0]; // デッキの一番上のカード
                                if (depth === 1) {
                                    // 見つかったモンスターの処理
                                    if (isCorrectGuess) {
                                        // 宣言が的中した場合、墓地へ
                                        withNotification(state, card, { message: "宣言が的中しました。" }, (state) => {
                                            sendCard(state, state.deck[0], "Graveyard");
                                        });
                                    } else {
                                        withNotification(
                                            state,
                                            card,
                                            { message: "宣言が外れました。" },
                                            (state, card) => {
                                                // 宣言が外れた場合、特殊召喚
                                                withUserSummon(state, card, state.deck[0], {}, () => {});
                                            }
                                        );
                                    }
                                } else {
                                    // 途中でめくったカードは墓地へ
                                    sendCard(state, currentCard, "Graveyard");
                                    state.deck[0].position = "attack";
                                }
                            },
                            (state, card) => {
                                resolve?.(state, card);
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies MagicCard;
