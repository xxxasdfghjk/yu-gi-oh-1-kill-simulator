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
                    declaredLevel = Math.floor(Math.random() * 8) + 1;
                }

                withNotification(
                    state,
                    card,
                    {
                        message: `相手はレベル${declaredLevel}を宣言しました`,
                    },
                    (state, card) => {
                        const index = new CardSelector(state)
                            .deck()
                            .get()
                            .findIndex((e) => e !== null && monsterFilter(e.card) && e.card.canNormalSummon === true);
                        const foundMonster: CardInstance = new CardSelector(state).deck().get()[index]!;
                        const isSummon = getLevel(foundMonster) === declaredLevel;

                        withDelayRecursive(
                            state,
                            card,
                            { delay: 200 },
                            index,
                            (state, card, depth) => {
                                if (depth === 0) {
                                    if (isSummon) {
                                        withUserSummon(state, card, state.deck[0], {}, () => {});
                                    } else {
                                        sendCard(state, state.deck[0], "Graveyard");
                                    }
                                } else {
                                    sendCard(state, state.deck[0], "Graveyard");
                                }
                            },
                            () => {}
                        );
                    }
                );
            },
        },
    },
} satisfies MagicCard;
