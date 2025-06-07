import type { CardInstance } from "@/types/card";
import { isMonsterCard } from "@/utils/gameUtils";
import type { GameStore } from "./gameStore";

export const helper = {
    checkFafnirMuBetaSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "竜輝巧－ファフμβ'") {
            return false;
        }
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "竜輝巧－ファフμβ'（墓地に送るモンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return state.deck.filter((e) => e.card.card_name.includes("竜輝巧"));
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "send_to_graveyard",
        });
    },

    checkLinkliboSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "リンクリボー") {
            return false;
        }
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "リンクリボー（墓地に送るモンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return state.deck.filter((e) => (e.card as { level?: number })?.level === 1);
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "send_to_graveyard",
        });
    },
    checkCyberAngelBentenReleaseEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "サイバー・エンジェル－弁天－") {
            return false;
        }
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "サイバー・エンジェル－弁天－（手札に加えるモンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return state.deck.filter((e) => {
                    const { attribute, race } = e.card as { attribute?: string; race?: string };
                    return attribute === "光属性" && race === "天使族";
                });
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "get_hand_single",
        });
    },

    checkFafnirSummonEffect: (state: GameStore, card: CardInstance) => {
        if (
            state.field.fieldZone?.card.card_name !== "竜輝巧－ファフニール" ||
            state.hasActivatedFafnirSummonEffect === true
        ) {
            return false;
        }
        const existingDreitron = !![...state.field.extraMonsterZones, ...state.field.monsterZones].find(
            (e) => e?.id !== card.id && e?.card.card_name.includes("竜輝巧")
        );

        if (!existingDreitron) {
            return false;
        }
        state.effectQueue.push({
            id: "",
            type: "option",
            effectName:
                "竜輝巧－ファフニール（効果の発動を選択）レベルをその攻撃力１０００につき１つ下げる（最小１まで）",
            cardInstance: card,
            canCancel: true,
            option: [{ name: "発動する", value: "use" }],
            effectType: "fafnir_summon_effect_option",
        });
    },

    checkCyberAngelIdatenSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "サイバー・エンジェル－韋駄天－") {
            return false;
        }
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "サイバー・エンジェル－韋駄天－（手札に加える儀式魔法を選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return [...state.deck, ...state.graveyard].filter((e) => e.card.card_type === "儀式魔法");
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "get_hand_single",
        });
    },

    checkCyberAngelIdatenReleaseEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "サイバー・エンジェル－韋駄天－") {
            return false;
        }
        console.log("toutatsu");
        for (let i = 0; i < 5; i++) {
            if (state.field.monsterZones[i]?.card.card_type === "儀式・効果モンスター") {
                state.field.monsterZones[i]!.buf.attack += 1000;
                state.field.monsterZones[i]!.buf.defense += 1000;
            }
        }
    },

    checkFieldSummonEffect: (state: GameStore, card: CardInstance) => {
        helper.checkFafnirMuBetaSummonEffect(state, card);
        helper.checkLinkliboSummonEffect(state, card);
        helper.checkFafnirSummonEffect(state, card);
        helper.checkCyberAngelIdatenSummonEffect(state, card);
    },
    checkReleaseEffect: (state: GameStore, card: CardInstance) => {
        helper.checkCyberAngelBentenReleaseEffect(state, card);
        helper.checkCyberAngelIdatenReleaseEffect(state, card);
    },

    checkFieldDestoryEffect: (state: GameStore, card: CardInstance) => {
        helper.checkFafnirMuBetaGraveyardEffectInternal(state, card);
    },
    checkClitterGraveyardEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "クリッター" && state.hasActivatedCritter) {
            return false;
        }
        // カード選択をキューに追加
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "クリッター（モンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return state.deck.filter(
                    (e) => isMonsterCard(e.card) && ((e.card as { attack?: number })?.attack ?? 9999) <= 1500
                );
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "clitter_effect_search",
        });
        return true;
    },
    monsterExcludeFromField: (state: GameStore, card: CardInstance) => {
        const extraIndex = state.field.extraMonsterZones.findIndex((e) => e?.id === card.id);
        if (extraIndex !== -1) {
            state.field.extraMonsterZones[extraIndex] = null;
        }
        const monsterIndex = state.field.monsterZones.findIndex((e) => e?.id === card.id);
        if (monsterIndex !== -1) {
            state.field.monsterZones[monsterIndex] = null;
        }
    },
    updateFieldMonster: (state: GameStore, card: CardInstance) => {
        const extraIndex = state.field.extraMonsterZones.findIndex((e) => e?.id === card.id);
        if (extraIndex !== -1) {
            state.field.extraMonsterZones[extraIndex] = card;
        }
        const monsterIndex = state.field.monsterZones.findIndex((e) => e?.id === card.id);
        if (monsterIndex !== -1) {
            state.field.monsterZones[monsterIndex] = card;
        }
    },
    checkFafnirMuBetaGraveyardEffectInternal: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "竜輝巧－ファフμβ'") {
            return false;
        }

        // カード選択をキューに追加
        state.effectQueue.push({
            id: `fafnir_mu_beta_graveyard_${Date.now()}`,
            type: "select",
            effectName: "竜輝巧－ファフμβ'（特殊召喚するモンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                const handDrytronMonsters = state.hand.filter((c) => {
                    if (!isMonsterCard(c.card)) return false;
                    return c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                });

                const deckDrytronMonsters = state.deck.filter((c) => {
                    if (!isMonsterCard(c.card)) return false;
                    return c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
                });
                return [...handDrytronMonsters, ...deckDrytronMonsters];
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "fafnir_mu_beta_graveyard",
        });
        return true;
    },
    sendMonsterToGraveyardInternalAnywhere: (state: GameStore, monster: CardInstance, context?: "release") => {
        const graveyardCard = {
            ...monster,
            location: "graveyard" as const,
            position: undefined,
            buf: { attack: 0, defense: 0, level: 0 },
        };
        let locate = "";
        console.log([...state.field.spellTrapZones]);
        console.log(monster);
        const trapZoneIndex = state.field.spellTrapZones.findIndex((c) => c?.id === monster.id);
        if (trapZoneIndex !== -1) {
            state.field.spellTrapZones[trapZoneIndex] = null;
            locate = "field";
        }

        // フィールドのモンスターゾーンから削除
        const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === monster.id);
        if (zoneIndex !== -1) {
            state.field.monsterZones[zoneIndex] = null;
            locate = "field";
        }
        // エクストラモンスターゾーンからも確認
        const extraZoneIndex = state.field.extraMonsterZones.findIndex((c) => c?.id === monster.id);
        if (extraZoneIndex !== -1) {
            state.field.extraMonsterZones[extraZoneIndex] = null;
            locate = "field";
        }
        if (state.hand.findIndex((c) => c.id === monster.id) !== -1) {
            locate = "hand";
        }
        if (state.deck.findIndex((c) => c.id === monster.id) !== -1) {
            locate = "deck";
        }
        state.hand = state.hand.filter((c) => c.id !== monster.id);
        state.deck = state.deck.filter((c) => c.id !== monster.id);
        monster.materials.forEach((e) => {
            const graveyardCard = {
                ...e,
                buf: { attack: 0, level: 0, defense: 0 },
                location: "graveyard" as const,
                position: undefined,
            };
            state.graveyard.push(graveyardCard);
        });
        graveyardCard.materials = [];
        state.graveyard.push(graveyardCard);
        if (locate === "field") {
            helper.checkFieldDestoryEffect(state, monster);
        }
        if (context === "release") {
            helper.checkReleaseEffect(state, monster);
        }
        return locate;
    },

    summonMonsterFromAnywhere: (
        state: GameStore,
        monster: CardInstance,
        targetZone: number | null = null,
        position: "attack" | "defense" | "facedown" | "facedown_defense" = "attack"
    ) => {
        state.hand = state.hand.filter((c) => c.id !== monster.id);
        state.deck = state.deck.filter((c) => c.id !== monster.id);
        state.extraDeck = state.extraDeck.filter((c) => c.id !== monster.id);
        if (targetZone !== null) {
            if (targetZone === 5 || targetZone === 6) {
                const summonedMonster = {
                    ...monster,
                    location: "field_monster" as const,
                    position: position,
                    zone: targetZone,
                };
                state.field.extraMonsterZones[targetZone - 5] = summonedMonster;
            } else {
                const summonedMonster = {
                    ...monster,
                    location: "field_monster" as const,
                    position: position,
                    zone: targetZone,
                };
                state.field.monsterZones[targetZone] = summonedMonster;
            }
        } else {
            const emptyZone = targetZone ? targetZone : state.field.monsterZones.findIndex((zone) => zone === null);
            if (emptyZone !== -1) {
                const summonedMonster = {
                    ...monster,
                    location: "field_monster" as const,
                    position: position,
                    zone: emptyZone,
                };
                state.field.monsterZones[emptyZone] = summonedMonster;
            }
        }
        helper.checkFieldSummonEffect(state, monster);
    },
    toHandFromAnywhere: (state: GameStore, card: CardInstance) => {
        state.deck = state.deck.filter((c) => c.id !== card.id);
        state.graveyard = state.graveyard.filter((c) => c.id !== card.id);
        state.field.monsterZones = state.field.monsterZones.filter((c) => c?.card.id !== card.id);
        state.hand.push({ ...card, location: "hand" });
    },
};
