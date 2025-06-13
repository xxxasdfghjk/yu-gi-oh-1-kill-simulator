import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { banish } from "@/utils/cardMovement";
import { withUserSelectCard, withDelay, withUserSummon } from "@/utils/effectUtils";

export default {
    card_name: "神聖なる魂",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 6,
    element: "光" as const,
    race: "天使" as const,
    attack: 2000,
    defense: 1800,
    text: "このカードは通常召喚できない。自分の墓地から光属性モンスター２体を除外した場合に特殊召喚できる。(1)：このカードがモンスターゾーンに存在する限り、相手フィールドのモンスターの攻撃力は、相手バトルフェイズの間３００ダウンする。",
    image: "card100177659_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: (gameState: GameStore, cardInstance: CardInstance) => {
                if (cardInstance.location !== "Hand") return false;

                // Check if there are at least 2 light attribute monsters in graveyard
                const lightMonsters = gameState.graveyard.filter((card) => {
                    if (!monsterFilter(card.card)) return false;
                    return card.card.element === "光";
                });

                const hasEmptyZone = gameState.field.monsterZones.some((zone) => zone === null);

                return lightMonsters.length >= 2 && hasEmptyZone;
            },
            effect: (gameState: GameStore, cardInstance: CardInstance) => {
                const lightMonsters = (gameState: GameStore) =>
                    gameState.graveyard.filter((card) => {
                        if (!monsterFilter(card.card)) return false;
                        return card.card.element === "光";
                    });

                withUserSelectCard(
                    gameState,
                    cardInstance,
                    lightMonsters,
                    {
                        select: "multi",
                        condition: (cards) => cards.length === 2,
                        message: "除外する光属性モンスター2体を選択してください",
                    },
                    (state, card, selected) => {
                        // Sequential banishing with delay for proper animation
                        selected.forEach((monster, index) => {
                            withDelay(state, card, { order: index + 1 }, (delayState) => {
                                banish(delayState, monster);
                            });
                        });
                        // Special summon this card
                        withUserSummon(state, card, card, {}, () => {
                            // Card is summoned
                        });
                    }
                );
            },
        },
    },
};
