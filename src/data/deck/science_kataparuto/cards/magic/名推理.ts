import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSummon, withNotification, withDelayRecursive } from "@/utils/effectUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { getLevel } from "@/utils/gameUtils";

export default {
    card_name: "名推理",
    card_type: "魔法" as const,
    text: "相手プレイヤーはモンスターのレベルを宣言する。通常召喚が可能なモンスターが出るまで自分のデッキからカードをめくる。出たモンスターが宣言されたレベルと同じ場合、めくったカードを全て墓地へ送る。違う場合、出たモンスターを特殊召喚し、残りのカードを墓地へ送る。",
    image: "card73707891_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore) => {
                return state.deck.length > 0 && new CardSelector(state).deck().filter().canNormalSummon().len() > 0;
            },
            effect: (state: GameStore, card: CardInstance) => {
                // 相手の宣言レベルを決定
                const fieldMonsters = new CardSelector(state).allMonster().filter().nonNull().get();

                let declaredLevel: number;
                const hasLevel5Monster = fieldMonsters.some(
                    (m) => monsterFilter(m.card) && "level" in m.card && m.card.level === 5
                );
                const hasLevel1Monster = fieldMonsters.some(
                    (m) => monsterFilter(m.card) && "level" in m.card && m.card.level === 1
                );

                if (hasLevel5Monster && hasLevel1Monster) {
                    declaredLevel = 8;
                } else if (hasLevel5Monster) {
                    declaredLevel = 1;
                } else if (hasLevel1Monster) {
                    declaredLevel = 5;
                } else {
                    declaredLevel = 5;
                }

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
                            // 通常召喚可能なモンスターが見つからない場合
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
                            foundIndex + 1, // 見つかったモンスターを含む枚数
                            (state, card, depth) => {
                                const currentIndex = foundIndex + 1 - depth; // 0から始まるインデックス
                                const currentCard = state.deck[0]; // デッキの一番上のカード
                                if (currentIndex === foundIndex) {
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
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies MagicCard;
