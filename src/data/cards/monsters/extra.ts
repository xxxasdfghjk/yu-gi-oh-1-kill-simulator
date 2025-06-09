import type { ExtraMonster } from "@/types/card";
import {
    sumLevel,
    monsterFilter,
    hasLevelMonsterFilter,
    sumLink,
    isMagicCard,
    isRitualMonster,
    createCardInstance,
} from "@/utils/cardManagement";
import {
    withUserConfirm,
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withOption,
} from "@/utils/effectUtils";
import { sendCard, summon } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { TOKEN } from "../tokens";

// Define extra monsters as literal objects with proper typing
export const EXTRA_MONSTERS = [
    {
        card_name: "虹光の宣告者",
        card_type: "モンスター" as const,
        monster_type: "シンクロモンスター" as const,
        level: 4,
        element: "光" as const,
        race: "天使" as const,
        attack: 600,
        defense: 1000,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                sumLevel(card) === 4 &&
                card.find((e) => monsterFilter(e.card) && e.card.hasTuner) &&
                card.find((e) => monsterFilter(e.card) && !e.card.hasTuner)
            );
        },
        text: "チューナー＋チューナー以外のモンスター１体以上\n(1)：このカードがモンスターゾーンに存在する限り、お互いの手札・デッキから墓地へ送られるモンスターは墓地へは行かず除外される。\n(2)：モンスターの効果・魔法・罠カードが発動した時、このカードをリリースして発動できる。その発動を無効にし破壊する。\n(3)：このカードが墓地へ送られた場合に発動できる。デッキから儀式モンスター１体または儀式魔法カード１枚を手札に加える。",
        image: "card100179270_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasLink: false as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    return (
                        cardInstance.location === "MonsterField" &&
                        gameState.effectQueue.some(
                            (effect) =>
                                effect.effectType?.includes("monster") ||
                                effect.effectType?.includes("magic") ||
                                effect.effectType?.includes("trap")
                        )
                    );
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withUserConfirm(
                        gameState,
                        cardInstance,
                        { message: "発動を無効にし破壊しますか？" },
                        (state, card) => {
                            sendCard(state, card, "Graveyard");
                        }
                    );
                },
            },
            onAnywhereToGraveyard: (gameState: GameStore, cardInstance: CardInstance) => {
                const ritualCards = (gameState: GameStore) =>
                    gameState.deck.filter((card) => {
                        if (isMagicCard(card.card) && card.card.magic_type === "儀式魔法") return true;
                        if (isRitualMonster(card.card)) {
                            return true;
                        }
                        return false;
                    });

                if (ritualCards(gameState).length === 0) return;
                withUserConfirm(gameState, cardInstance, {}, (state, card) => {
                    withUserSelectCard(state, card, ritualCards, { select: "single" }, (state, _card, selected) => {
                        sendCard(state, selected[0], "Hand");
                    });
                });
            },
        },
    },
    {
        card_name: "セイクリッド・トレミスM7",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 6,
        element: "光" as const,
        race: "機械" as const,
        attack: 2700,
        defense: 2000,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 6));
        },
        text: "レベル６モンスター×２\\nこのカードは「セイクリッド・トレミスM７」以外の自分フィールドの「セイクリッド」Xモンスターの上に重ねてX召喚する事もできる。この方法で特殊召喚したターン、このカードの①の効果は発動できない。①：１ターンに１度、このカードのX素材を１つ取り除き、自分または相手の、フィールド・墓地のモンスター１体を対象として発動できる。そのモンスターを持ち主の手札に戻す。",
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
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        if (card.materials && card.materials.length > 0) {
                            card.materials.splice(0, 1);
                        }

                        const targets = [
                            ...state.field.monsterZones.filter((c) => c !== null),
                            ...state.field.extraMonsterZones.filter((c) => c !== null),
                            ...state.graveyard.filter((c) => monsterFilter(c.card)),
                        ];

                        if (targets.length > 0) {
                            withUserSelectCard(state, card, targets, { select: "single" }, (state, _card, selected) => {
                                sendCard(state, selected[0], "Hand");
                            });
                        }
                    });
                },
            },
        },
    },
    {
        card_name: "永遠の淑女 ベアトリーチェ",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 6,
        element: "光" as const,
        race: "天使" as const,
        attack: 2500,
        defense: 2800,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 6));
        },
        text: "①1ターンに1度、このカードのX素材を1つ取り除いて発動できる。デッキからカード1枚を選んで墓地へ送る。この効果は相手ターンでも発動できる。②このカードが相手によって破壊され墓地へ送られた場合に発動できる。EXデッキから「彼岸」モンスター1体を召喚条件を無視して特殊召喚する。",
        image: "card100330938_1.jpg",
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
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        if (card.materials && card.materials.length > 0) {
                            sendCard(state, card.materials[0], "Graveyard");
                        }

                        withUserSelectCard(state, card, state.deck, { select: "single" }, (state, _card, selected) => {
                            sendCard(state, selected[0], "Graveyard");
                        });
                    });
                },
            },
        },
    },
    {
        card_name: "竜輝巧－ファフμβ'",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 1,
        element: "光" as const,
        race: "機械" as const,
        attack: 2000,
        defense: 0,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length >= 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1));
        },
        text: "レベル１モンスター×２体以上\\nこのカード名の①③の効果はそれぞれ１ターンに１度しか使用できない。\\n①：このカードがX召喚した場合に発動できる。デッキから「ドライトロン」カード１枚を墓地へ送る。\\n②：自分が儀式召喚を行う場合、そのリリースするモンスターを、このカードのX素材から取り除く事もできる。\\n③：自分フィールドに機械族の儀式モンスターが存在し、相手が魔法・罠カードを発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にし破壊する。",
        image: "card100221516_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {
            onSummon: (gameState: GameStore, cardInstance: CardInstance) => {
                if (!withTurnAtOneceCondition(gameState, cardInstance, () => true, "ファフμβ'_effect1")) return;
                const draitronCards = gameState.deck.filter((card) => {
                    return card.card.card_name.includes("竜輝巧");
                });

                if (draitronCards.length === 0) return;
                withTurnAtOneceEffect(
                    gameState,
                    cardInstance,
                    (state, card) => {
                        withUserConfirm(state, card, {}, (confirmState, confirmCard) => {
                            withUserSelectCard(
                                confirmState,
                                confirmCard,
                                draitronCards,
                                { select: "single" },
                                (selectState, _card, selected) => {
                                    sendCard(selectState, selected[0], "Graveyard");
                                }
                            );
                        });
                    },
                    "ファフμβ'_effect1"
                );
            },
        },
    },
    {
        card_name: "幻獣機アウローラドン",
        card_type: "モンスター" as const,
        monster_type: "リンクモンスター" as const,
        link: 3,
        linkDirection: ["左", "下", "右"] as const,
        element: "風" as const,
        race: "機械" as const,
        attack: 2100,
        materialCondition: (card: CardInstance[]) => {
            return !!(
                card.filter((e) => monsterFilter(e.card) && e.card.race === "機械").length >= 2 && sumLink(card) === 3
            );
        },
        text: "機械族モンスター２体以上\\n①：このカードがリンク召喚に成功した場合に発動できる。自分フィールドに「幻獣機トークン」（機械族・風・星３・攻／守０）３体を特殊召喚する。このターン、自分はリンク召喚できない。②：１ターンに１度、自分フィールドのモンスターを３体までリリースして発動できる。リリースしたモンスターの数によって以下の効果を適用する。●１体：フィールドのカード１枚を選んで破壊する。●２体：デッキから「幻獣機」モンスター１体を特殊召喚する。●３体：自分の墓地から罠カード１枚を選んで手札に加える。",
        image: "card100179342_1.jpg",
        hasDefense: false as const,
        hasLevel: false as const,
        hasLink: true as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onSummon: (gameState: GameStore) => {
                const emptyZones = gameState.field.monsterZones
                    .map((zone, index) => ({ zone, index }))
                    .filter(({ zone }) => zone === null);

                if (emptyZones.length < 3) return;

                const phantomBeastToken = TOKEN.find((token) => token.card_name === "幻獣機トークン");
                if (!phantomBeastToken) return;

                for (let i = 0; i < 3 && i < emptyZones.length; i++) {
                    const tokenInstance = createCardInstance(phantomBeastToken, "MonsterField", true);
                    summon(gameState, tokenInstance, emptyZones[i].index, "attack");
                }

                gameState.isLinkSummonProhibited = true;
            },
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

                    const fieldMonsters = [
                        ...gameState.field.monsterZones,
                        ...gameState.field.extraMonsterZones,
                    ].filter((zone) => zone !== null);

                    return fieldMonsters.length > 0;
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
                                fieldMonsters,
                                {
                                    select: "multi",
                                    condition: (cards: CardInstance[]) => cards.length === chosenEffect.count,
                                },
                                (releaseState, releaseCard, selected) => {
                                    selected.forEach((monster) => {
                                        sendCard(releaseState, monster, "Graveyard");
                                    });

                                    if (chosenEffect.count === 1) {
                                        const destroyTargets = [
                                            ...releaseState.field.monsterZones,
                                            ...releaseState.field.extraMonsterZones,
                                            ...releaseState.field.spellTrapZones,
                                            releaseState.field.fieldZone,
                                        ].filter((target): target is CardInstance => target !== null);

                                        if (destroyTargets.length > 0) {
                                            withUserSelectCard(
                                                releaseState,
                                                releaseCard,
                                                destroyTargets,
                                                { select: "single" },
                                                (destroyState, _destroyCard, destroySelected) => {
                                                    sendCard(destroyState, destroySelected[0], "Graveyard");
                                                }
                                            );
                                        }
                                    } else if (chosenEffect.count === 2) {
                                        const mpbMonsters = releaseState.deck.filter((c) => {
                                            if (!monsterFilter(c.card)) return false;
                                            return c.card.card_name.includes("幻獣機");
                                        });

                                        if (mpbMonsters.length > 0) {
                                            withUserSelectCard(
                                                releaseState,
                                                releaseCard,
                                                mpbMonsters,
                                                { select: "single" },
                                                (summonState, summonCard, summonSelected) => {
                                                    withUserSummon(
                                                        summonState,
                                                        summonCard,
                                                        summonSelected[0],
                                                        () => {}
                                                    );
                                                }
                                            );
                                        }
                                    } else if (chosenEffect.count === 3) {
                                        const trapCards = releaseState.graveyard.filter((c) => {
                                            return c.card.card_type === "罠";
                                        });

                                        if (trapCards.length > 0) {
                                            withUserSelectCard(
                                                releaseState,
                                                releaseCard,
                                                trapCards,
                                                { select: "single" },
                                                (trapState, _trapCard, trapSelected) => {
                                                    sendCard(trapState, trapSelected[0], "Hand");
                                                }
                                            );
                                        }
                                    }
                                }
                            );
                        });
                    });
                },
            },
        },
    },
    {
        card_name: "警衛バリケイドベルグ",
        card_type: "モンスター" as const,
        monster_type: "リンクモンスター" as const,
        link: 2,
        linkDirection: ["左", "下"] as const,
        element: "闇" as const,
        race: "機械" as const,
        attack: 1000,
        materialCondition: (card: CardInstance[]) => {
            const uniqueNames = new Set(card.map((c) => c.card.card_name));
            return card.length === 2 && uniqueNames.size === 2 && sumLink(card) === 2;
        },
        text: "このカード名の①の効果は１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合、手札を１枚捨てて発動できる。このターンのエンドフェイズに、自分の墓地から永続魔法カードまたはフィールド魔法カード１枚を選んで手札に加える。②：このカードがモンスターゾーンに存在する限り、自分フィールドの表側表示の魔法カードは相手の効果では破壊されない。",
        image: "card100322913_1.jpg",
        hasDefense: false as const,
        hasLevel: false as const,
        hasLink: true as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

                    const faceUpMonsters = [
                        ...gameState.field.monsterZones,
                        ...gameState.field.extraMonsterZones,
                    ].filter(
                        (monster) =>
                            monster !== null && monster.position !== "back_defense" && monster.position !== "back"
                    );

                    return faceUpMonsters.length > 0;
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        const faceUpMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                            (monster) =>
                                monster !== null && monster.position !== "back_defense" && monster.position !== "back"
                        );

                        withUserSelectCard(
                            state,
                            card,
                            faceUpMonsters,
                            { select: "single" },
                            (state, card, selected) => {
                                // Equipment effect implementation would go here
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "ユニオン・キャリアー",
        card_type: "モンスター" as const,
        monster_type: "リンクモンスター" as const,
        link: 2,
        linkDirection: ["下", "右"] as const,
        element: "光" as const,
        race: "機械" as const,
        attack: 1000,
        materialCondition: (card: CardInstance[]) => {
            if (card.length !== 2 || sumLink(card) !== 2) return false;

            const [card1, card2] = card;
            // Check if they have the same race or same element
            if (!monsterFilter(card1.card) || !monsterFilter(card2.card)) {
                return false;
            }

            const sameRace = card1.card.race === card2.card.race;
            const sameElement = card1.card.element === card2.card.element;

            return sameRace || sameElement;
        },
        text: "種族または属性が同じモンスター2体\nこのカード名の効果は１ターンに１度しか使用できない。このカードはリンク召喚されたターンにはリンク素材にできない。①：自分フィールドの表側表示モンスター１体を対象として発動できる。元々の種族または元々の属性が対象のモンスターと同じモンスター１体を手札・デッキから選び、攻撃力１０００アップの装備カード扱いとして対象のモンスターに装備する。この効果でデッキから装備した場合、ターン終了時まで自分はその装備したモンスターカード及びその同名モンスターを特殊召喚できない。",
        image: "card100179237_1.jpg",
        hasDefense: false as const,
        hasLevel: false as const,
        hasLink: true as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

                    const faceUpMonsters = [
                        ...gameState.field.monsterZones,
                        ...gameState.field.extraMonsterZones,
                    ].filter(
                        (monster) =>
                            monster !== null && monster.position !== "back_defense" && monster.position !== "back"
                    );

                    return faceUpMonsters.length > 0;
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    withTurnAtOneceEffect(gameState, cardInstance, (state, card) => {
                        const faceUpMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                            (monster) =>
                                monster !== null && monster.position !== "back_defense" && monster.position !== "back"
                        );

                        withUserSelectCard(
                            state,
                            card,
                            faceUpMonsters,
                            { select: "single" },
                            (state, _card, selected) => {
                                // Equipment effect would be implemented here
                            }
                        );
                    });
                },
            },
        },
    },
    {
        card_name: "転生炎獣アルミラージ",
        card_type: "モンスター" as const,
        monster_type: "リンクモンスター" as const,
        link: 1,
        linkDirection: ["右下"] as const,
        element: "炎" as const,
        race: "サイバース" as const,
        attack: 0,
        materialCondition: (card: CardInstance[]) => {
            return card.length === 1 && sumLink(card) === 1;
        },
        text: "通常召喚された攻撃力1000以下のモンスター1体\nこのカード名の②の効果は１ターンに１度しか使用できない。①：このカードをリリースし、自分フィールドのモンスター１体を対象として発動できる。このターン、そのモンスターは相手の効果では破壊されない。この効果は相手ターンでも発動できる。②：このカードが墓地に存在し、通常召喚された自分のモンスターが戦闘で破壊された時に発動できる。このカードを特殊召喚する。",
        image: "card100354764_1.jpg",
        hasDefense: false as const,
        hasLevel: false as const,
        hasLink: true as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {
            onIgnition: {
                condition: (gameState: GameStore, cardInstance: CardInstance) => {
                    return cardInstance.location === "MonsterField";
                },
                effect: (gameState: GameStore, cardInstance: CardInstance) => {
                    // Release self to protect another monster
                    const targetMonsters = [
                        ...gameState.field.monsterZones,
                        ...gameState.field.extraMonsterZones,
                    ].filter((monster): monster is CardInstance => monster !== null && monster.id !== cardInstance.id);

                    if (targetMonsters.length > 0) {
                        withUserSelectCard(
                            gameState,
                            cardInstance,
                            targetMonsters,
                            { select: "single" },
                            (state, card, _selected) => {
                                sendCard(state, card, "Graveyard");
                                // Add protection effect to selected monster
                            }
                        );
                    }
                },
            },
            onAnywhereToGraveyard: (gameState: GameStore, cardInstance: CardInstance) => {
                // Special summon from graveyard when normal summoned monster is destroyed
                const normalSummonedMonsters = [
                    ...gameState.field.monsterZones,
                    ...gameState.field.extraMonsterZones,
                ].filter((monster) => monster !== null && monster.summonedBy === "Normal");

                if (normalSummonedMonsters.length > 0) {
                    withUserConfirm(gameState, cardInstance, {}, (state, card) => {
                        withUserSummon(state, card, card, () => {});
                    });
                }
            },
        },
    },
    {
        card_name: "リンクリボー",
        card_type: "モンスター" as const,
        monster_type: "リンクモンスター" as const,
        link: 1,
        linkDirection: ["下"] as const,
        element: "闇" as const,
        race: "サイバース" as const,
        attack: 300,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 1 && hasLevelMonsterFilter(card[0].card) && card[0].card.level === 1);
        },
        text: "①このカードがリンク召喚に成功した時に発動できる。デッキからレベル1モンスター1体を墓地へ送る。②このカードが戦闘で破壊された場合に発動できる。手札からレベル1モンスター1体を特殊召喚する。",
        image: "card100358454_1.jpg",
        hasDefense: false as const,
        hasLevel: false as const,
        hasLink: true as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {},
    },
    {
        card_name: "旧神ヌトス",
        card_type: "モンスター" as const,
        monster_type: "融合モンスター" as const,
        level: 4,
        element: "光" as const,
        race: "天使" as const,
        attack: 2500,
        defense: 1200,
        materialCondition: () => true,
        text: "Ｓモンスター＋Ｘモンスター\\n自分フィールドの上記カードを墓地へ送った場合のみ特殊召喚できる（「融合」は必要としない）。自分は「旧神ヌトス」を１ターンに１度しか特殊召喚できない。(1)：１ターンに１度、自分メインフェイズに発動できる。手札からレベル４モンスター１体を特殊召喚する。(2)：このカードが墓地へ送られた場合、フィールドのカード１枚を対象として発動できる。そのカードを破壊する。",
        image: "card100065315_1.jpg",
        hasDefense: true as const,
        hasLevel: true as const,
        hasLink: false as const,
        hasRank: false as const,
        canNormalSummon: false,
        effect: {},
    },
    {
        card_name: "天霆號アーゼウス",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 12,
        element: "光" as const,
        race: "機械" as const,
        attack: 3000,
        defense: 3000,
        materialCondition: (card: CardInstance[]) => {
            return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && e.card.level === 12));
        },
        text: "「天霆號アーゼウス」は、Xモンスターが戦闘を行ったターンに１度、自分フィールドのXモンスターの上に重ねてX召喚する事もできる。①：このカードのX素材を２つ取り除いて発動できる。このカード以外のフィールドのカードを全て墓地へ送る。この効果は相手ターンでも発動できる。②：１ターンに１度、このカード以外の自分フィールドのカードが戦闘または相手の効果で破壊された場合に発動できる。手札・デッキ・EXデッキからカード１枚を選び、このカードの下に重ねてX素材とする。",
        image: "card100336782_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {},
    },
    {
        card_name: "FNo.0 未来皇ホープ",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 0,
        element: "光" as const,
        race: "戦士" as const,
        attack: 0,
        defense: 0,
        materialCondition: () => true,
        text: "ルール上、このカードのランクは１として扱う。①：このカードは戦闘では破壊されず、このカードの戦闘で発生するお互いの戦闘ダメージは０になる。②：このカードが相手モンスターと戦闘を行ったダメージステップ終了時に発動できる。その相手モンスターのコントロールをバトルフェイズ終了時まで得る。②：フィールドのこのカードが効果で破壊される場合、代わりにこのカードのＸ素材を１つ取り除く事ができる。",
        image: "card100178133_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {},
    },
    {
        card_name: "FNo.0 未来龍皇ホープ",
        card_type: "モンスター" as const,
        monster_type: "エクシーズモンスター" as const,
        rank: 0,
        element: "光" as const,
        race: "戦士" as const,
        attack: 0,
        defense: 0,
        materialCondition: () => true,
        text: "ルール上、このカードのランクは１として扱い、このカード名は「未来皇ホープ」カードとしても扱う。このカードは自分フィールドの「FNo.0 未来皇ホープ」の上に重ねてX召喚する事もできる。①：このカードは戦闘・効果では破壊されない。②：１ターンに１度、相手がモンスターの効果を発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にする。この効果でフィールドのモンスターの効果の発動を無効にした場合、さらにそのコントロールを得る。",
        image: "card100323225_1.jpg",
        hasDefense: true as const,
        hasLevel: false as const,
        hasLink: false as const,
        hasRank: true as const,
        canNormalSummon: false,
        effect: {},
    },
] as const satisfies readonly ExtraMonster[];

export const ExtraMonsterMap = EXTRA_MONSTERS.reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {}) as Record<
    (typeof EXTRA_MONSTERS)[number]["card_name"],
    ExtraMonster
>;
