import type { ExtraMonster } from "@/types/card";
import {
    monsterFilter,
    createCardInstance,
} from "@/utils/cardManagement";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withOption,
    withDelay,
} from "@/utils/effectUtils";
import { sendCard, summon } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import TOKEN from "../token/幻獣機トークン";
import { calcCanSummonLink, getPrioritySetMonsterZoneIndex } from "@/utils/gameUtils";

const card = {
    card_name: "幻獣機アウローラドン",
    card_type: "モンスター" as const,
    monster_type: "リンクモンスター" as const,
    link: 3,
    linkDirection: ["左", "下", "右"] as const,
    element: "風" as const,
    race: "機械" as const,
    attack: 2100,
    filterAvailableMaterials: () => true,
    materialCondition: (card: CardInstance[]) => {
        return !!(
            card.filter((e) => monsterFilter(e.card) && e.card.race === "機械").length >= 2 &&
            calcCanSummonLink(card).includes(3)
        );
    },
    text: "機械族モンスター２体以上\n①：このカードがリンク召喚に成功した場合に発動できる。自分フィールドに「幻獣機トークン」（機械族・風・星３・攻／守０）３体を特殊召喚する。このターン、自分はリンク召喚できない。②：１ターンに１度、自分フィールドのモンスターを３体までリリースして発動できる。リリースしたモンスターの数によって以下の効果を適用する。●１体：フィールドのカード１枚を選んで破壊する。●２体：デッキから「幻獣機」モンスター１体を特殊召喚する。●３体：自分の墓地から罠カード１枚を選んで手札に加える。",
    image: "card100179342_1.jpg",
    hasDefense: false as const,
    hasLevel: false as const,
    hasLink: true as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {
        onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
            const emptyZones = gameState.field.monsterZones
                .map((zone, index) => ({ zone, index }))
                .filter(({ zone }) => zone === null);

            if (emptyZones.length < 3) return;

            const phantomBeastToken = TOKEN;

            // Sequential token summoning with delay for proper animation
            for (let i = 0; i < 3 && i < 3; i++) {
                withDelay(gameState, cardInstance, { order: i + 1, delay: i * 20 }, (state) => {
                    const tokenInstance = createCardInstance(phantomBeastToken, "MonsterField", true);
                    const zoneIndex = getPrioritySetMonsterZoneIndex(state, false);
                    summon(state, tokenInstance, zoneIndex, "attack");
                });
            }
            gameState.isLinkSummonProhibited = true;
        },
        onIgnition: {
            condition: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

                const fieldMonsters = [...gameState.field.monsterZones, ...gameState.field.extraMonsterZones].filter(
                    (zone) => zone !== null
                );
                return fieldMonsters.length > 0 && cardInstance.location === "MonsterField";
            },
            effect: (gameState: GameStore, cardInstance: CardInstance) => {
                withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                    const fieldMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                        (zone): zone is CardInstance => zone !== null
                    );

                    const possibleEffects: { count: number; name: string }[] = [];

                    if (fieldMonsters.length >= 1) {
                        const destroyTargets = [
                            ...state.field.monsterZones,
                            ...state.field.extraMonsterZones,
                            ...state.field.spellTrapZones,
                            state.field.fieldZone,
                        ].filter((target): target is CardInstance => target !== null);

                        if (destroyTargets.length > 0) {
                            possibleEffects.push({ count: 1, name: "フィールドのカード1枚を破壊" });
                        }
                    }

                    if (fieldMonsters.length >= 2) {
                        const mpbMonsters = state.deck.filter((c) => {
                            if (!monsterFilter(c.card)) return false;
                            return c.card.card_name.includes("幻獣機");
                        });

                        if (mpbMonsters.length > 0) {
                            possibleEffects.push({ count: 2, name: "デッキから幻獣機モンスター1体を特殊召喚" });
                        }
                    }

                    if (fieldMonsters.length >= 3) {
                        const trapCards = state.graveyard.filter((c) => {
                            return c.card.card_type === "罠";
                        });

                        if (trapCards.length > 0) {
                            possibleEffects.push({ count: 3, name: "墓地から罠カード1枚を手札に加える" });
                        }
                    }

                    if (possibleEffects.length === 0) return;

                    const effectOptions = possibleEffects.map((effect) => ({
                        name: `${effect.count}体リリース: ${effect.name}` as const,
                        condition: () => true,
                    }));

                    withOption(state, card, effectOptions, (optionState, optionCard, chosenOption) => {
                        const chosenCount = parseInt(chosenOption.split("体リリース:")[0]);
                        const chosenEffect = possibleEffects.find((effect) => effect.count === chosenCount)!;

                        withUserSelectCard(
                            optionState,
                            optionCard,
                            (state: GameStore) => {
                                return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                                    (target): target is CardInstance => target !== null
                                );
                            },
                            {
                                select: "multi",
                                condition: (cards: CardInstance[]) => cards.length === chosenEffect.count,
                                message: `リリースするモンスターを${chosenEffect.count}体選んでください`,
                            },
                            (releaseState, releaseCard, selected) => {
                                // Sequential card sending with delay for proper animation
                                selected.forEach((monster, index) => {
                                    withDelay(releaseState, releaseCard, { order: -1, delay: index * 20 }, (state) => {
                                        sendCard(state, monster, "Graveyard");
                                    });
                                });

                                if (chosenEffect.count === 1) {
                                    const destroyTargets = (state: GameStore) =>
                                        [
                                            ...state.field.monsterZones,
                                            ...state.field.extraMonsterZones,
                                            ...state.field.spellTrapZones,
                                            state.field.fieldZone,
                                        ].filter((target): target is CardInstance => target !== null);

                                    withUserSelectCard(
                                        releaseState,
                                        releaseCard,
                                        destroyTargets,
                                        {
                                            select: "single",
                                            message: "破壊するフィールドのカードを1枚選んでください",
                                        },
                                        (destroyState, _, destroySelected) => {
                                            sendCard(destroyState, destroySelected[0], "Graveyard");
                                        }
                                    );
                                } else if (chosenEffect.count === 2) {
                                    const mpbMonsters = (state: GameStore) =>
                                        state.deck.filter((c) => {
                                            if (!monsterFilter(c.card)) return false;
                                            return c.card.card_name.includes("幻獣機");
                                        });

                                    withUserSelectCard(
                                        releaseState,
                                        releaseCard,
                                        mpbMonsters,
                                        {
                                            select: "single",
                                            message: "デッキから幻獣機モンスターを1体選んで特殊召喚してください",
                                        },
                                        (summonState, summonCard, summonSelected) => {
                                            withUserSummon(summonState, summonCard, summonSelected[0], {}, () => {});
                                        }
                                    );
                                } else if (chosenEffect.count === 3) {
                                    const trapCards = (state: GameStore) =>
                                        state.graveyard.filter((c) => {
                                            return c.card.card_type === "罠";
                                        });

                                    withUserSelectCard(
                                        releaseState,
                                        releaseCard,
                                        trapCards,
                                        {
                                            select: "single",
                                            message: "墓地から罠カードを1枚選んで手札に加えてください",
                                        },
                                        (trapState, _trapCard, trapSelected) => {
                                            sendCard(trapState, trapSelected[0], "Hand");
                                        }
                                    );
                                }
                            }
                        );
                    });
                });
            },
        },
    },
} satisfies ExtraMonster;

export default card;
