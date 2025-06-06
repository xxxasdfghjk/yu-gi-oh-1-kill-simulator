import type { CardInstance } from "@/types/card";
import { isMonsterCard } from "@/utils/gameUtils";
import type { GameStore } from "./gameStore";

export const helper = {
    selectEruGanmaGraveyardMonster: (state: GameStore, monster: CardInstance) => {
        // 墓地から選択されたカードを削除
        state.graveyard = state.graveyard.filter((c: CardInstance) => c.id !== monster.id);

        // 空のモンスターゾーンを探す
        const emptyZone = state.field.monsterZones.findIndex((zone: CardInstance | null) => zone === null);

        if (emptyZone !== -1) {
            // フィールドに特殊召喚
            const summonedMonster = {
                id: monster.id,
                card: monster.card,
                location: "field_monster" as const,
                position: "defense" as const,
                zone: emptyZone,
            };

            state.field.monsterZones[emptyZone] = summonedMonster;
            state.hasSpecialSummoned = true;
        }

        // 効果状態をクリア
        state.eruGanmaState = null;
        state.searchingEffect = null;
    },
    selectBanAlphaRitualMonster: (state: GameStore, ritualMonster: CardInstance) => {
        if (!state.banAlphaState || state.banAlphaState.phase !== "select_ritual_monster") {
            return;
        }

        // 儀式モンスターをデッキから手札に加える
        state.deck = state.deck.filter((c) => c.id !== ritualMonster.id);
        const cardToHand = { ...ritualMonster, location: "hand" as const };
        state.hand.push(cardToHand);
        // Clear the effect states in a separate update to ensure UI refresh
        state.banAlphaState = null;
        state.searchingEffect = null;
    },
    selectBanAlphaReleaseTarget: (state: GameStore, targetCard: CardInstance) => {
        // Get the current state to verify we have valid banAlphaState
        if (!state.banAlphaState || state.banAlphaState.phase !== "select_release_target") {
            return;
        }

        const banAlphaCard = state.banAlphaState.banAlphaCard!;

        // Try multiple separate state updates to isolate the issue
        let searchingEffectReset = false;
        if (targetCard.location === "hand") {
            searchingEffectReset = helper.sendMonsterToGraveyardInternal(state, targetCard, "hand");
            state.hand = state.hand.filter((c) => c.id !== targetCard.id);
        } else if (targetCard.location === "field_monster") {
            const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === targetCard.id);
            if (zoneIndex !== -1) {
                searchingEffectReset = helper.sendMonsterToGraveyardInternal(state, targetCard, "field");
            }
        }
        if (banAlphaCard.location === "hand") {
            state.hand = state.hand.filter((c) => c.id !== banAlphaCard.id);
        } else if (banAlphaCard.location === "graveyard") {
            state.graveyard = state.graveyard.filter((c) => c.id !== banAlphaCard.id);
        }
        const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);

        if (emptyZone !== -1) {
            // Create new summoned monster object
            const summonedMonster = {
                id: banAlphaCard.id,
                card: banAlphaCard.card,
                location: "field_monster" as const,
                position: "defense" as const,
                zone: emptyZone,
            };

            // Force array update
            const newMonsterZones = [...state.field.monsterZones];
            newMonsterZones[emptyZone] = summonedMonster;
            state.field.monsterZones = newMonsterZones;

            state.hasSpecialSummoned = true;
            state.searchingEffect = null;
        }

        // デッキから儀式モンスターを選択
        const ritualMonsters = state.deck.filter(
            (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
        );

        if (ritualMonsters.length > 0) {
            state.banAlphaState = {
                phase: "select_ritual_monster",
                banAlphaCard: banAlphaCard,
            };

            state.searchingEffect = {
                cardName: "竜輝巧－バンα（儀式モンスター選択）",
                availableCards: ritualMonsters,
                effectType: "ban_alpha_ritual_select",
            };
        } else {
            state.banAlphaState = null;
            state.searchingEffect = searchingEffectReset ? state.searchingEffect : null;
        }
    },

    selectEruGanmaReleaseTarget: (state: GameStore, targetCard: CardInstance) => {
        if (!state.eruGanmaState || state.eruGanmaState.phase !== "select_release_target") {
            return;
        }
        const eruGanmaCard = state.eruGanmaState.eruGanmaCard!;

        // Try multiple separate state updates to isolate the issue
        if (targetCard.location === "hand") {
            helper.sendMonsterToGraveyardInternal(state, targetCard, "hand");
        } else if (targetCard.location === "field_monster") {
            const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === targetCard.id);
            if (zoneIndex !== -1) {
                helper.sendMonsterToGraveyardInternal(state, targetCard, "field");
            }
        }
        if (eruGanmaCard.location === "hand") {
            state.hand = state.hand.filter((c) => c.id !== eruGanmaCard.id);
        } else if (eruGanmaCard.location === "graveyard") {
            state.graveyard = state.graveyard.filter((c) => c.id !== eruGanmaCard.id);
        }

        const emptyZone = state.field.monsterZones.findIndex((zone) => zone === null);

        if (emptyZone !== -1) {
            // Create new summoned monster object
            const summonedMonster = {
                id: eruGanmaCard.id,
                card: eruGanmaCard.card,
                location: "field_monster" as const,
                position: "defense" as const,
                zone: emptyZone,
            };

            // Force array update
            const newMonsterZones = [...state.field.monsterZones];
            newMonsterZones[emptyZone] = summonedMonster;
            state.field.monsterZones = newMonsterZones;
            state.hasSpecialSummoned = true;

            // エルγ特殊召喚後の効果：墓地から攻撃力2000の「ドライトロン」モンスター（エルγ以外）を特殊召喚
            const graveyardMonsters = state.graveyard.filter((c: CardInstance) => {
                const card = c.card;
                
                // モンスターカードかチェック
                const isMonster = card.card_type && (
                    card.card_type.includes("モンスター") ||
                    card.card_type === "通常モンスター" ||
                    card.card_type === "効果モンスター" ||
                    card.card_type === "儀式・効果モンスター"
                );
                
                if (!isMonster) return false;
                
                // 攻撃力2000かチェック
                const monster = card as { attack?: number };
                if (monster.attack !== 2000) return false;
                
                // ドライトロンモンスターかチェック（エルγ以外）
                const isDrytron = card.card_name.includes("竜輝巧") || card.card_name.includes("ドライトロン");
                const isNotEruGanma = card.card_name !== "竜輝巧－エルγ";
                
                return isDrytron && isNotEruGanma;
            });

            if (graveyardMonsters.length > 0) {
                // 墓地からモンスター選択の状態を設定
                state.searchingEffect = {
                    cardName: "竜輝巧－エルγ（墓地からモンスター特殊召喚）",
                    availableCards: graveyardMonsters,
                    effectType: "eru_ganma_graveyard_select",
                };
                state.eruGanmaState = null; // リリース状態は終了
            } else {
                state.eruGanmaState = null;
                state.searchingEffect = null;
            }
        }
    },
    checkFafnirMuBetaGraveyardEffectInternal: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "竜輝巧－ファフμβ'") {
            return false;
        }

        // 手札・デッキからドライトロンモンスターを探す
        const handDrytronMonsters = state.hand.filter((c) => {
            if (!isMonsterCard(c.card)) return false;
            return c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
        });

        const deckDrytronMonsters = state.deck.filter((c) => {
            if (!isMonsterCard(c.card)) return false;
            return c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン");
        });

        const allDrytronMonsters = [...handDrytronMonsters, ...deckDrytronMonsters];

        if (allDrytronMonsters.length === 0) {
            return false;
        }

        // カード選択UIを表示
        state.searchingEffect = {
            cardName: "竜輝巧－ファフμβ'の墓地送り時効果",
            availableCards: allDrytronMonsters,
            effectType: "fafnir_mu_beta_graveyard",
        };
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
};
