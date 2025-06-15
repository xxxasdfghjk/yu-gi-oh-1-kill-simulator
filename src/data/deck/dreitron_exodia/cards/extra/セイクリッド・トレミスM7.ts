import type { ExtraMonster } from "@/types/card";
import {
    monsterFilter,
    hasLevelMonsterFilter,
} from "@/utils/cardManagement";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getLevel } from "@/utils/gameUtils";

// Define extra monsters as literal objects with proper typing

const card = {
        card_name: "セイクリッド・トレミスM7",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 6,
        element: "光" as const,
        race: "機械" as const,
        attack: 2700,
        defense: 2000,
        filterAvailableMaterials: (card) => hasLevelMonsterFilter(card.card) && getLevel(card) === 6,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 6));
        },
        text: "レベル６モンスター×２\nこのカードは「セイクリッド・トレミスM７」以外の自分フィールドの「セイクリッド」Xモンスターの上に重ねてX召喚する事もできる。この方法で特殊召喚したターン、このカードの①の効果は発動できない。①：１ターンに１度、このカードのX素材を１つ取り除き、自分または相手の、フィールド・墓地のモンスター１体を対象として発動できる。そのモンスターを持ち主の手札に戻す。",
        image: "card100287504_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;
                    return cardInstance.materials && cardInstance.materials.length > 0;
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    const targets = (gameState: GameStore) => [
                        ...gameState.field.monsterZones.filter((c) => c !== null),
                        ...gameState.field.extraMonsterZones.filter((c) => c !== null),
                        ...gameState.graveyard.filter((c) => monsterFilter(c.card)),
                    ];
                    if (targets(gameState).length === 0) {
                        return;
                    }

                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        withUserSelectCard(
                            state,
                            card,
                            () => {
                                return cardInstance.materials;
                            },
                            { select: "single", message: "X素材を1つ選んでください" },
                            (state, _card, selectedMaterial) => {
                                withUserSelectCard(
                                    state,
                                    card,
                                    targets,
                                    { select: "single", message: "手札に戻すモンスターを1体選んでください" },
                                    (state, _card, selected) => {
                                        sendCard(state, selectedMaterial[0], "Graveyard");
                                        sendCard(state, selected[0], "Hand");
                                    }
                                );
                            }
                        );
                    });
                },
            },
        },
    } satisfies ExtraMonster;

export default card;
