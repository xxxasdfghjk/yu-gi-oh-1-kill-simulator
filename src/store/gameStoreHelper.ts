import type { CardInstance } from "@/types/card";
import { isMonsterCard } from "@/utils/gameUtils";
import type { GameStore } from "./gameStore";

export const helper = {
    selectEruGanmaGraveyardMonster: (state: GameStore, monster: CardInstance) => {
        helper.summonMonsterFromAnywhere(state, monster);
    },
    selectBanAlphaRitualMonster: (state: GameStore, ritualMonster: CardInstance) => {
        // 儀式モンスターをデッキから手札に加える

        state.deck = state.deck.filter((c) => c.id !== ritualMonster.id);
        const cardToHand = { ...ritualMonster, location: "hand" as const };
        state.hand.push(cardToHand);
        // Clear the effect states in a separate update to ensure UI refresh
        state.banAlphaState = null;
    },
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
        console.log("hasActivatedFafnirSummonEffect", state.hasActivatedFafnirSummonEffect);
        if (
            state.field.fieldZone?.card.card_name !== "竜輝巧－ファフニール" ||
            state.hasActivatedFafnirSummonEffect === true
        ) {
            return false;
        }
        console.log("fffff");
        const existingDreitron = !![...state.field.extraMonsterZones, ...state.field.monsterZones].find(
            (e) => e?.id !== card.id && e?.card.card_name.includes("竜輝巧")
        );
        console.log(existingDreitron);

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

    checkFieldSummonEffect: (state: GameStore, card: CardInstance) => {
        helper.checkFafnirMuBetaSummonEffect(state, card);
        helper.checkLinkliboSummonEffect(state, card);
        helper.checkFafnirSummonEffect(state, card);
    },
    checkReleaseEffect: (state: GameStore, card: CardInstance) => {
        helper.checkCyberAngelBentenReleaseEffect(state, card);
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
    sendMonsterToGraveyardInternal: (
        state: GameStore,
        monster: CardInstance,
        fromLocation: "field" | "hand" | "deck"
    ) => {
        const graveyardCard = { ...monster, location: "graveyard" as const };
        let effectOccurred = false;
        if (fromLocation === "field") {
            // フィールドのモンスターゾーンから削除
            const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === monster.id);
            if (zoneIndex !== -1) {
                state.field.monsterZones[zoneIndex] = null;
            }
            // エクストラモンスターゾーンからも確認
            const extraZoneIndex = state.field.extraMonsterZones.findIndex((c) => c?.id === monster.id);
            if (extraZoneIndex !== -1) {
                state.field.extraMonsterZones[extraZoneIndex] = null;
            }
            effectOccurred = helper.checkFafnirMuBetaGraveyardEffectInternal(state, monster);
        } else if (fromLocation === "hand") {
            state.hand = state.hand.filter((c) => c.id !== monster.id);
        } else if (fromLocation === "deck") {
            state.deck = state.deck.filter((c) => c.id !== monster.id);
        }
        // 墓地に追加

        state.graveyard.push(graveyardCard);
        return effectOccurred;
    },
    sendMonsterToGraveyardInternalAnywhere: (state: GameStore, monster: CardInstance, context?: "release") => {
        const graveyardCard = { ...monster, location: "graveyard" as const };
        let locate = "";

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
            const graveyardCard = { ...e, buf: { attack: 0, level: 0, defence: 0 }, location: "graveyard" as const };
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

    summonMonsterFromAnywhere: (state: GameStore, monster: CardInstance, targetZone: number | null = null) => {
        state.hand = state.hand.filter((c) => c.id !== monster.id);
        state.deck = state.deck.filter((c) => c.id !== monster.id);
        state.extraDeck = state.extraDeck.filter((c) => c.id !== monster.id);
        if (targetZone !== null) {
            if (targetZone === 5 || targetZone === 6) {
                const summonedMonster = {
                    ...monster,
                    location: "field_monster" as const,
                    position: "defense" as const,
                    zone: targetZone,
                };
                state.field.extraMonsterZones[targetZone - 5] = summonedMonster;
            } else {
                const summonedMonster = {
                    ...monster,
                    location: "field_monster" as const,
                    position: "defense" as const,
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
                    position: "defense" as const,
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
        state.hand.push(card);
    },
};
