import type { Card, CardInstance, MonsterCard } from "@/types/card";
import { isMonsterCard, createCardInstance } from "@/utils/gameUtils";
import { getTokenCard } from "@/data/cardLoader";
import type { GameStore } from "./gameStore";
import { canActivateHokyuYoin } from "@/utils/summonUtils";

export const helper = {
    banishCardFromGraveyard: (state: GameStore, card: CardInstance) => {
        state.graveyard = state.graveyard.filter((c) => c.id !== card.id);
        const banishedCard = {
            ...card,
            location: "banished" as const,
            position: undefined,
            buf: { attack: 0, defense: 0, level: 0 },
            equipped: undefined,
            summonedBy: undefined,
        };
        state.banished.push(banishedCard);
    },
    tryActivateHokyuYoin: (state: GameStore) => {
        const hokyuYoinExisting = state.field.spellTrapZones.find((e) => e?.card.card_name === "補充要員");
        console.log("aaaa");
        if (hokyuYoinExisting === null || hokyuYoinExisting === undefined) {
            return;
        }
        console.log("aaaakokoko");

        if (!canActivateHokyuYoin(state)) {
            return;
        }
        console.log("aaaakokokojjjjjjjjj");

        state.effectQueue.unshift({
            id: "",
            type: "multiselect",
            effectName: `補充要員（回収対象選択）`,
            cardInstance: hokyuYoinExisting,
            getAvailableCards: (state: GameStore) => {
                return state.graveyard.filter((e) => {
                    if (!isMonsterCard(e.card)) {
                        return false;
                    }
                    const typed = e.card as MonsterCard;
                    return typed.attack <= 1500 && typed.card_type === "通常モンスター";
                });
            },
            condition: (cards: CardInstance[]) => {
                return cards.length >= 1 && cards.length <= 3;
            },
            effectType: "get_hand_multi",
            canCancel: false,
        });
    },

    checkFafnirMuBetaSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "竜輝巧－ファフμβ'") {
            return false;
        }
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "竜輝巧－ファフμβ'（墓地に送るカードを選択）",
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
    checkDestoryEffect: (state: GameStore, card: CardInstance) => {
        helper.checkArcDeclarerDestoryEffect(state, card);
    },
    checkArcDeclarerDestoryEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "虹光の宣告者") {
            return false;
        }
        const target = [...state.deck, ...state.graveyard].filter(
            (e) => e.card.card_type === "儀式魔法" || e.card.card_type === "儀式・効果モンスター"
        );
        if (target.length > 0) {
            state.effectQueue.push({
                id: ``,
                type: "select",
                effectName: "虹光の宣告者（手札に加える儀式魔法または儀式モンスターを選択）",
                cardInstance: card,
                getAvailableCards: (state) => {
                    return [...state.deck, ...state.graveyard].filter(
                        (e) => e.card.card_type === "儀式魔法" || e.card.card_type === "儀式・効果モンスター"
                    );
                },
                canCancel: true,
                condition: (card) => card.length === 1,
                effectType: "get_hand_single",
            });
        }
    },

    checkDivinerSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "宣告者の神巫") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedDivinerSummonEffect) {
            return false;
        }

        // デッキ・エクストラデッキから天使族モンスターを選択
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "宣告者の神巫（デッキ・EXデッキから天使族モンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return [...state.deck, ...state.extraDeck].filter((e) => {
                    if (!isMonsterCard(e.card)) return false;
                    const monster = e.card as { race?: string };
                    return monster.race === "天使族";
                });
            },
            canCancel: true,
            condition: (card) => card.length === 1,
            effectType: "diviner_summon_effect",
        });
    },

    checkAuroradonLinkSummonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "幻獣機アウローラドン") {
            return false;
        }

        // トークンを召喚できる空きゾーンをチェック
        const emptyZones = state.field.monsterZones
            .map((zone, index) => ({ zone, index }))
            .filter(({ zone }) => zone === null);

        if (emptyZones.length < 3) {
            return false;
        }

        // トークン3体を召喚（最大で空きゾーンの数まで）
        const tokenCount = 3;

        // トークンカードを取得
        const tokenCard = getTokenCard("幻獣機トークン")! as Card;

        // トークンを空きゾーンに配置
        for (let i = 0; i < tokenCount; i++) {
            const token = createCardInstance(tokenCard, "field_monster", true);
            helper.summonMonsterFromAnywhere(state, token);
        }
        // このターンリンク召喚できない制限を設定
        state.isLinkSummonProhibited = true;

        return true;
    },

    checkBeatriceEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "永遠の淑女 ベアトリーチェ") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedBeatriceEffect) {
            return false;
        }

        // X素材があるかチェック
        if (!card.materials || card.materials.length === 0) {
            return false;
        }

        // デッキからカード1枚を選んで墓地へ送る効果
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "永遠の淑女 ベアトリーチェ（デッキからカード1枚を墓地へ送る）",
            cardInstance: card,
            getAvailableCards: (state) => {
                return state.deck; // デッキから任意のカード1枚
            },
            canCancel: false,
            condition: (cards) => cards.length === 1,
            effectType: "beatrice_mill_effect",
        });
        return true;
    },

    checkPtolemyM7Effect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "セイクリッド・トレミスM7") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedPtolemyM7Effect) {
            return false;
        }

        // X素材があるかチェック
        if (!card.materials || card.materials.length === 0) {
            return false;
        }

        // フィールド・墓地のモンスターを手札に戻す効果
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "セイクリッド・トレミスM7（フィールド・墓地のモンスター1体を手札に戻す）",
            cardInstance: card,
            getAvailableCards: (state) => {
                const fieldMonsters = [
                    ...state.field.monsterZones,
                    ...state.field.extraMonsterZones,
                    ...state.opponentField.monsterZones,
                ].filter((monster): monster is CardInstance => monster !== null && isMonsterCard(monster.card));

                const graveyardMonsters = state.graveyard.filter((monster) => isMonsterCard(monster.card));

                return [...fieldMonsters, ...graveyardMonsters];
            },
            canCancel: true,
            condition: (cards) => cards.length === 1,
            effectType: "ptolemy_m7_return_effect",
        });
        return true;
    },

    checkAuroradonEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "幻獣機アウローラドン") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedAuroradonEffect) {
            return false;
        }

        // フィールドに他のモンスターがいるかチェック（自分自身以外）
        const otherMonstersOnField = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
            (monster) => monster !== null && monster.id !== card.id
        );

        if (otherMonstersOnField.length === 0) {
            return false;
        }

        // アウローラドンと他のモンスターをリリースして機械族を特殊召喚
        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "幻獣機アウローラドン（リリースする他のモンスターを選択）",
            cardInstance: card,
            getAvailableCards: () => otherMonstersOnField as CardInstance[],
            canCancel: true,
            condition: (cards) => cards.length === 1,
            effectType: "auroradon_tribute_select",
        });
        return true;
    },

    checkUnionCarrierEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "ユニオン・キャリアー") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedUnionCarrierEffect) {
            return false;
        }

        // フィールドの表側表示モンスターを装備対象として選択
        const faceUpMonsters = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
            (monster) => monster !== null && monster.position !== "facedown" && monster.position !== "facedown_defense"
        );

        if (faceUpMonsters.length === 0) {
            return false;
        }

        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "ユニオン・キャリアー（装備対象のモンスターを選択）",
            cardInstance: card,
            getAvailableCards: (state) =>
                [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                    (monster) =>
                        monster !== null && monster.position !== "facedown" && monster.position !== "facedown_defense"
                ) as CardInstance[],
            canCancel: true,
            condition: (cards) => cards.length === 1,
            effectType: "union_carrier_target_select",
        });
        return true;
    },

    checkMeteorKikougunGraveyardEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "流星輝巧群") {
            return false;
        }

        // 1ターンに1度の制限チェック
        if (state.hasActivatedMeteorKikougunGraveyardEffect) {
            return false;
        }

        // カードが墓地にあるかチェック
        if (card.location !== "graveyard") {
            return false;
        }

        // フィールドのドライトロンモンスターを対象として選択
        const drytronMonstersOnField = [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
            (monster) => {
                if (!monster || !isMonsterCard(monster.card)) return false;
                return monster.card.card_name.includes("竜輝巧") || monster.card.card_name.includes("ドライトロン");
            }
        );

        if (drytronMonstersOnField.length === 0) {
            return false;
        }

        state.effectQueue.push({
            id: ``,
            type: "select",
            effectName: "流星輝巧群（攻撃力を1000ダウンするドライトロンモンスターを選択）",
            cardInstance: card,
            getAvailableCards: () => drytronMonstersOnField as CardInstance[],
            canCancel: true,
            condition: (cards) => cards.length === 1,
            effectType: "meteor_kikougun_graveyard_effect",
        });
        return true;
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
        helper.checkDivinerSummonEffect(state, card);
        helper.checkAuroradonLinkSummonEffect(state, card);
    },
    checkReleaseEffect: (state: GameStore, card: CardInstance) => {
        helper.checkCyberAngelBentenReleaseEffect(state, card);
        helper.checkCyberAngelIdatenReleaseEffect(state, card);
    },

    checkFieldDestoryEffect: (state: GameStore, card: CardInstance) => {
        helper.checkFafnirMuBetaGraveyardEffectInternal(state, card);
        helper.checkClitterGraveyardEffect(state, card);
    },
    checkClitterGraveyardEffect: (state: GameStore, card: CardInstance) => {
        if (card.card.card_name !== "クリッター" || state.hasActivatedCritter) {
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
        card.equipped?.forEach((e) => {
            const equipment = state.field.spellTrapZones.find((equip) => equip?.id === e);
            if (equipment) {
                helper.sendMonsterToGraveyardInternalAnywhere(state, equipment);
            }
        });
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
            equipped: undefined,
            summonnedBy: undefined,
        };
        let locate = "";
        const trapZoneIndex = state.field.spellTrapZones.findIndex((c) => c?.id === monster.id);
        if (trapZoneIndex !== -1) {
            state.field.spellTrapZones[trapZoneIndex] = null;
            locate = "field";
            for (let i = 0; i < 5; i++) {
                const found = state.field.monsterZones[i]?.equipped?.findIndex((e) => e === monster.id);
                if (found !== -1 && found !== undefined) {
                    state.field.monsterZones[i]!.equipped = state.field.monsterZones[i]!.equipped!.filter(
                        (e) => e !== monster.id
                    );
                }
            }
            for (let i = 0; i < 2; i++) {
                const found = state.field.extraMonsterZones[i]?.equipped?.findIndex((e) => e === monster.id);
                if (found !== -1 && found !== undefined) {
                    state.field.extraMonsterZones[i]!.equipped = state.field.extraMonsterZones[i]!.equipped!.filter(
                        (e) => e !== monster.id
                    );
                }
            }
        }
        monster.equipped?.forEach((e) => {
            const equipment = state.field.spellTrapZones.find((equip) => equip?.id === e);
            if (equipment) {
                helper.sendMonsterToGraveyardInternalAnywhere(state, equipment);
            }
        });

        // フィールドのモンスターゾーンから削除
        const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === monster.id);
        for (let i = 0; i < 5; i++) {
            const target = state.field.monsterZones[i]?.materials.find((e) => e.id === monster.id);
            if (target) {
                state.field.monsterZones[i]!.materials = state.field.monsterZones[i]!.materials.filter(
                    (e) => monster.id !== e.id
                );
                locate = "field";
            }
        }
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
        for (let i = 0; i < 2; i++) {
            const target = state.field.extraMonsterZones[i]?.materials.find((e) => e.id === monster.id);
            if (target) {
                state.field.extraMonsterZones[i]!.materials = state.field.extraMonsterZones[i]!.materials.filter(
                    (e) => monster.id !== e.id
                );
                locate = "material";
            }
        }

        if (state.hand.findIndex((c) => c.id === monster.id) !== -1) {
            locate = "hand";
        }
        if (state.deck.findIndex((c) => c.id === monster.id) !== -1) {
            locate = "deck";
        }
        state.hand = state.hand.filter((c) => c.id !== monster.id);
        state.deck = state.deck.filter((c) => c.id !== monster.id);
        state.extraDeck = state.extraDeck.filter((c) => c.id !== monster.id);

        monster.materials.forEach((e) => {
            const graveyardCard = {
                ...e,
                buf: { attack: 0, level: 0, defense: 0 },
                location: "graveyard" as const,
                position: undefined,
                equipped: undefined,
                summonnedBy: undefined,
            };
            state.graveyard.push(graveyardCard);
        });
        graveyardCard.materials = [];
        if (!monster.isToken) {
            state.graveyard.push(graveyardCard);
        }
        if (locate === "field") {
            helper.checkFieldDestoryEffect(state, monster);
        }
        if (context === "release") {
            helper.checkReleaseEffect(state, monster);
        }
        helper.checkDestoryEffect(state, monster);
        return locate;
    },

    summonMonsterFromAnywhere: (
        state: GameStore,
        monster: CardInstance,
        targetZone: number | null = null,
        position: "attack" | "defense" | "facedown" | "facedown_defense" = "attack",
        context: "normal" | "special" | "link" = "special"
    ) => {
        state.hand = state.hand.filter((c) => c.id !== monster.id);
        state.deck = state.deck.filter((c) => c.id !== monster.id);
        state.extraDeck = state.extraDeck.filter((c) => c.id !== monster.id);
        state.graveyard = state.graveyard.filter((c) => c.id !== monster.id);

        if (targetZone !== null) {
            const summonedMonster = {
                ...monster,
                location: "field_monster" as const,
                position: position,
                zone: targetZone,
                summonedBy: context,
            };
            if (targetZone === 5 || targetZone === 6) {
                state.field.extraMonsterZones[targetZone - 5] = summonedMonster;
            } else {
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
                    summonedBy: context,
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
        state.field.extraMonsterZones = state.field.extraMonsterZones.filter((c) => c?.card.id !== card.id);

        card.materials.forEach((e) => {
            helper.sendMonsterToGraveyardInternalAnywhere(state, e);
        });
        card.equipped?.forEach((e) => {
            const equipment = state.field.spellTrapZones.find((equip) => equip?.id === e);
            if (equipment) {
                helper.sendMonsterToGraveyardInternalAnywhere(state, equipment);
            }
        });

        if (
            card.card.card_type === "エクシーズモンスター" ||
            card.card.card_type === "リンクモンスター" ||
            card.card.card_type === "融合モンスター" ||
            card.card.card_type === "シンクロモンスター"
        ) {
            state.extraDeck.push({
                ...card,
                location: "extra_deck",
                buf: { attack: 0, level: 0, defense: 0 },
                equipped: undefined,
                summonedBy: undefined,
            });
        } else {
            state.hand.push({
                ...card,
                location: "hand",
                buf: { attack: 0, level: 0, defense: 0 },
                equipped: undefined,
                summonedBy: undefined,
            });
        }
    },
};
