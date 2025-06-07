import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, GamePhase } from "@/types/game";
import { loadDeckData } from "@/data/cardLoader";
import {
    createCardInstance,
    shuffleDeck,
    drawCards,
    isMonsterCard,
    isSpellCard,
    isTrapCard,
    getLevel,
} from "@/utils/gameUtils";
import {
    canNormalSummon,
    findEmptyMonsterZone,
    canActivateSpell,
    findEmptySpellTrapZone,
    canSetSpellTrap,
    canActivateHokyuYoin,
} from "@/utils/summonUtils";
import type { CardInstance, MonsterCard } from "@/types/card";
import { helper } from "./gameStoreHelper";
import { getAttack } from "../utils/gameUtils";

export type EffectQueueItem =
    | {
          id: string;
          type: "search" | "select" | "multiselect" | "confirm";
          effectName: string;
          cardInstance: CardInstance;
          maxSelections?: number;
          effectType: string;
          filterFunction?: (card: CardInstance, alreadySelected: CardInstance[]) => boolean;
          getAvailableCards: (state: GameStore) => CardInstance[];
          condition: (selectedCards: CardInstance[]) => boolean;
          canCancel: boolean;
      }
    | {
          id: string;
          type: "option";
          effectName: string;
          cardInstance: CardInstance;
          maxSelections?: number;
          option: { name: string; value: string }[];
          effectType: string;
          canCancel: boolean;
      }
    | {
          id: string;
          type: "link_summon";
          cardInstance: CardInstance;
          effectType: string;
      };

export interface GameStore extends GameState {
    initializeGame: () => void;
    drawCard: (count?: number) => void;
    nextPhase: () => void;
    selectCard: (cardId: string) => void;
    playCard: (cardId: string, zone?: number) => void;
    summonMonster: (cardId: string, position: "attack" | "facedown_defense", zone?: number) => void;
    setCard: (cardId: string, zone?: number) => void;
    activateFieldCard: (cardId: string) => void;
    activateSetCard: (cardId: string) => void;
    activateSpellEffect: (card: CardInstance) => void;
    selectForJackInHand: (selectedCards: CardInstance[]) => void;
    continueJackInHand: () => void;
    selectPlayerCardFromJack: (selectedCard: CardInstance) => void;
    selectExtravaganceCount: (count: 3 | 6) => void;
    selectCardFromExtravagance: (selectedCard: CardInstance) => void;
    selectCardFromRevealedCards: (selectedCard: CardInstance, remainingCards: CardInstance[]) => void;
    activateChickenRaceEffect: (effectType: "draw" | "destroy" | "heal") => void;
    setPhase: (phase: GamePhase) => void;
    activateTrapCard: (card: CardInstance) => void;
    declineTrapActivation: () => void;
    selectHokyuyoinTargets: (selectedCards: CardInstance[]) => void;
    selectBonmawashiCards: (selectedCards: CardInstance[]) => void;
    selectBonmawashiForPlayer: (card: CardInstance) => void;
    checkBonmawashiRestriction: () => void;
    activateOpponentFieldSpell: () => void;
    activateBanAlpha: (eruGanmaCard: CardInstance) => void;
    activateEruGanma: (eruGanmaCard: CardInstance) => void;
    activateAruZeta: (eruGanmaCard: CardInstance) => void;

    selectBanAlphaRitualMonster: (ritualMonster: CardInstance) => void;
    selectEruGanmaGraveyardMonster: (monster: CardInstance) => void;
    checkCritterEffect: (card: CardInstance) => void;
    startLinkSummon: (linkMonster: CardInstance) => void;
    selectLinkMaterials: (materials: CardInstance[]) => void;
    summonLinkMonster: (zone: number) => void;
    startXyzSummon: (xyzMonster: CardInstance) => void;
    selectXyzMaterials: (materials: CardInstance[]) => void;
    summonXyzMonster: (zone: number) => void;
    checkFafnirMuBetaXyzSummonEffect: () => void;
    checkFafnirMuBetaGraveyardEffect: (card: CardInstance) => void;
    activateMeteorKikougun: (card: CardInstance) => void;
    effectQueue: EffectQueueItem[];
    addEffectToQueue: (effect: EffectQueueItem) => void;
    processQueueTop: (
        payload:
            | { type: "cardSelect"; cardList: CardInstance[] }
            | { type: "option"; option: { name: string; value: string }[] }
            | { type: "summon"; zone: number }
    ) => void;
    clearQueue: () => void;
    selectedCard: string | null;
    // 個別のサーチ効果状態
    foolishBurialState: {
        availableCards: CardInstance[];
    } | null;
    deckSearchState: {
        cardName: string;
        availableCards: CardInstance[];
        effectType: string;
    } | null;
    fafnirMuBetaState: {
        availableCards: CardInstance[];
        effectType: "xyz_summon" | "graveyard";
    } | null;
    hokyuyoinState: {
        availableCards: CardInstance[];
    } | null;
    linkRibohState: {
        availableCards: CardInstance[];
    } | null;
    meteorKikougunMonsterSelectState: {
        availableCards: CardInstance[];
    } | null;
    // 一時的に残す（段階的移行のため）
    searchingEffect: {
        cardName: string;
        availableCards: CardInstance[];
        effectType: string;
    } | null;
    summonSelecting: {
        cardId: string;
    } | null;
    jackInHandState: {
        phase: "select_three" | "opponent_takes" | "player_selects";
        availableCards: CardInstance[];
        selectedThree: CardInstance[];
        opponentCard?: CardInstance;
        remainingCards?: CardInstance[];
    } | null;
    extravaganceState: {
        phase: "select_count" | "select_card_from_deck";
        revealedCards?: CardInstance[];
        banishedCount?: number;
    } | null;
    advancedRitualState: {
        phase: "select_ritual_monster" | "select_normal_monsters";
        selectedRitualMonster?: CardInstance;
        requiredLevel?: number;
        availableNormals?: CardInstance[];
    } | null;
    bonmawashiState: {
        phase: "select_two" | "select_for_player";
        selectedCards?: CardInstance[];
    } | null;
    banAlphaState: {
        phase: "select_release_target" | "select_ritual_monster";
        banAlphaCard?: CardInstance;
        availableTargets?: CardInstance[];
    } | null;
    eruGanmaState: {
        phase: "select_release_target" | "select_ritual_monster";
        eruGanmaCard?: CardInstance;
        availableTargets?: CardInstance[];
    } | null;
    linkSummonState: {
        phase: "select_materials";
        linkMonster?: CardInstance;
        requiredMaterials?: number;
        selectedMaterials?: CardInstance[];
        availableMaterials?: CardInstance[];
    } | null;
    xyzSummonState: {
        phase: "select_materials";
        xyzMonster?: CardInstance;
        requiredRank?: number;
        requiredMaterials?: number;
        selectedMaterials?: CardInstance[];
        availableMaterials?: CardInstance[];
    } | null;
    oneForOneTarget: CardInstance | null;
}

const initialState: GameState = {
    turn: 1,
    phase: "main1",
    lifePoints: 8000,
    deck: [],
    hand: [],
    field: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
        extraMonsterZones: [null, null],
    },
    opponentField: {
        monsterZones: Array(5).fill(null),
        spellTrapZones: Array(5).fill(null),
        fieldZone: null,
    },
    graveyard: [],
    banished: [],
    extraDeck: [],
    hasNormalSummoned: false,
    hasSpecialSummoned: false,
    hasDrawnByEffect: false,
    hasActivatedExtravagance: false,
    hasActivatedChickenRace: false,
    hasActivatedFafnir: false,
    hasActivatedBanAlpha: false,
    hasActivatedCritter: false,
    hasActivatedEmergencyCyber: false,
    hasActivatedFafnirSummonEffect: false,
    isOpponentTurn: false,
    pendingTrapActivation: null,
    bonmawashiRestriction: false,
    currentChain: [],
    canActivateEffects: true,
    gameOver: false,
    winner: null,
    linkSummonState: null,
    xyzSummonState: null,
    meteorKikougunState: null,
    hasActivatedEruGanma: false,
    hasActivatedAruZeta: false,
    hasActivatedJackInTheHand: false,
};

const phaseOrder: GamePhase[] = ["draw", "standby", "main1", "end"];

export const useGameStore = create<GameStore>()(
    immer((set, get) => ({
        ...initialState,
        selectedCard: null,
        foolishBurialState: null,
        deckSearchState: null,
        fafnirMuBetaState: null,
        hokyuyoinState: null,
        linkRibohState: null,
        meteorKikougunMonsterSelectState: null,
        effectQueue: [],
        summonSelecting: null,
        jackInHandState: null,
        extravaganceState: null,
        advancedRitualState: null,
        bonmawashiState: null,
        banAlphaState: null,
        linkSummonState: null,
        xyzSummonState: null,
        meteorKikougunState: null,
        oneForOneTarget: null,
        eruGanmaState: null,
        initializeGame: () => {
            const deckData = loadDeckData();

            const mainDeckInstances = deckData.main_deck.flatMap((card) =>
                Array(card.quantity)
                    .fill(null)
                    .map(() => createCardInstance(card, "deck"))
            );

            const extraDeckInstances = deckData.extra_deck.flatMap((card) =>
                Array(card.quantity)
                    .fill(null)
                    .map(() => createCardInstance(card, "extra_deck"))
            );

            set((state) => {
                state.deck = shuffleDeck(mainDeckInstances);
                state.extraDeck = extraDeckInstances;
                state.hand = [];
                state.graveyard = [];
                state.banished = [];
                state.field = {
                    monsterZones: Array(5).fill(null),
                    spellTrapZones: Array(5).fill(null),
                    fieldZone: null,
                    extraMonsterZones: [null, null],
                };
                state.opponentField = {
                    monsterZones: Array(5).fill(null),
                    spellTrapZones: Array(5).fill(null),
                    fieldZone: null,
                };
                state.turn = 1;
                state.phase = "main1";
                state.lifePoints = 8000;
                state.hasNormalSummoned = false;
                state.hasSpecialSummoned = false;
                state.hasDrawnByEffect = false;
                state.hasActivatedExtravagance = false;
                state.hasActivatedChickenRace = false;
                state.hasActivatedFafnir = false;
                state.hasActivatedBanAlpha = false;
                state.hasActivatedCritter = false;
                state.hasActivatedEmergencyCyber = false;
                state.hasActivatedAruZeta = false;
                state.hasActivatedEruGanma = false;
                state.isOpponentTurn = false;
                state.pendingTrapActivation = null;
                state.bonmawashiRestriction = false;
                state.currentChain = [];
                state.canActivateEffects = true;
                state.gameOver = false;
                state.winner = null;
                state.selectedCard = null;
                state.searchingEffect = null;
                state.summonSelecting = null;
                state.jackInHandState = null;
                state.extravaganceState = null;
                state.advancedRitualState = null;
                state.bonmawashiState = null;
                state.banAlphaState = null;
                state.eruGanmaState = null;
                state.linkSummonState = null;
                state.xyzSummonState = null;
                state.meteorKikougunState = null;
                state.oneForOneTarget = null;
                state.hasActivatedFafnirSummonEffect = false;
            });

            // 初期手札15枚をドロー（デバッグ用）
            // まず愚かな埋葬をデッキから手札に移動
            set((state) => {
                const foolishBurialIndex = state.deck.findIndex((card) => card.card.card_name === "おろかな埋葬");
                if (foolishBurialIndex !== -1) {
                    const foolishBurial = state.deck[foolishBurialIndex];
                    foolishBurial.location = "hand";
                    state.hand.push(foolishBurial);
                    state.deck.splice(foolishBurialIndex, 1);
                } else {
                    // デッキの全カード名をログ出力してデバッグ
                }

                // クリッターもデッキから手札に移動（デバッグ用）
                const critterIndex = state.deck.findIndex((card) => card.card.card_name === "クリッター");
                if (critterIndex !== -1) {
                    const critter = state.deck[critterIndex];
                    critter.location = "hand";
                    state.hand.push(critter);
                    state.deck.splice(critterIndex, 1);
                }
            });

            // 残り14枚をドロー（愚かな埋葬が見つからなかった場合は15枚）
            const currentHandSize = get().hand.length;
            const remainingCards = 15 - currentHandSize;
            if (remainingCards > 0) {
                get().drawCard(remainingCards);
            }
        },

        drawCard: (count = 1) => {
            set((state) => {
                const newState = drawCards(state, count);
                Object.assign(state, newState);

                // エクゾディア勝利判定（デバッグ用に一時無効）
                // if (checkExodiaWin(state.hand)) {
                //     state.gameOver = true;
                //     state.winner = "player";
                // }
            });
        },

        nextPhase: () => {
            const currentState = get();

            if (currentState.isOpponentTurn) {
                // 相手ターン中の場合、プレイヤーターンに戻る
                set((state) => {
                    state.isOpponentTurn = false;
                    state.phase = "draw";
                    state.turn += 1;
                    state.hasNormalSummoned = false;
                    state.hasSpecialSummoned = false;
                    state.hasDrawnByEffect = false;
                    state.hasActivatedExtravagance = false;
                    state.hasActivatedChickenRace = false;
                    state.hasActivatedFafnir = false;
                    state.hasActivatedBanAlpha = false;
                    state.hasActivatedCritter = false;
                    state.hasActivatedEmergencyCyber = false;
                    state.hasActivatedJackInTheHand = false;
                });

                // プレイヤーターンのドローフェイズ
                get().drawCard(1);
                return;
            }

            const currentPhaseIndex = phaseOrder.indexOf(currentState.phase);
            const nextPhaseIndex = (currentPhaseIndex + 1) % phaseOrder.length;
            const nextPhase = phaseOrder[nextPhaseIndex];

            if (nextPhase === "draw") {
                // エンドフェーズ後、相手ターンに移行
                set((state) => {
                    state.isOpponentTurn = true;
                    state.phase = "main1"; // 相手のメインフェーズ
                });

                // 補充要員の確認（セットしたターンではない場合のみ、かつ発動条件を満たす場合のみ）
                const hokyuYoin = currentState.field.spellTrapZones.find(
                    (card) =>
                        card &&
                        card.card.card_name === "補充要員" &&
                        card.position === "facedown" &&
                        card.setTurn !== currentState.turn && // セットしたターンではない
                        canActivateHokyuYoin(currentState) // 墓地にモンスター5体以上
                );

                if (hokyuYoin) {
                    set((state) => {
                        state.pendingTrapActivation = hokyuYoin;
                    });
                }
            } else {
                // 通常のフェーズ移行
                set((state) => {
                    state.phase = nextPhase;
                });
            }
        },

        selectCard: (cardId: string) => {
            set((state) => {
                state.selectedCard = state.selectedCard === cardId ? null : cardId;
            });
        },

        playCard: (cardId: string, zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                return;
            }

            set((state) => {
                if (isMonsterCard(card.card)) {
                    // モンスターの場合は召喚選択モードに移行
                    if (!canNormalSummon(state, card)) return;

                    state.summonSelecting = {
                        cardId: cardId,
                    };
                    return;
                } else if (isSpellCard(card.card)) {
                    // 魔法カードの発動処理
                    console.log("Attempting to activate spell card:", card.card.card_name);
                    if (!canActivateSpell(state, card.card)) {
                        console.log("Cannot activate spell card:", card.card.card_name);
                        return;
                    }
                    console.log("Spell card activation allowed:", card.card.card_name);

                    // 手札から削除
                    state.hand = state.hand.filter((c) => c.id !== cardId);

                    if (card.card.card_type === "フィールド魔法") {
                        // 既存のフィールド魔法を墓地へ
                        if (state.field.fieldZone) {
                            const oldFieldCard = { ...state.field.fieldZone, location: "graveyard" as const };
                            state.graveyard.push(oldFieldCard);

                            // 盆回し制限チェック
                            if (oldFieldCard.setByBonmawashi) {
                                // 盆回しでセットされたフィールド魔法がフィールドから離れた場合の制限チェック
                                const opponentFieldHasBonmawashi =
                                    state.opponentField.fieldZone?.setByBonmawashi || false;

                                // 相手フィールドにも盆回しカードがない場合、制限を解除
                                if (!opponentFieldHasBonmawashi) {
                                    state.bonmawashiRestriction = false;
                                }
                            }
                        }
                        const updatedCard = { ...card, location: "field_spell_trap" as const };
                        state.field.fieldZone = updatedCard;
                    } else if (
                        card.card.card_type === "通常魔法" ||
                        card.card.card_type === "速攻魔法" ||
                        card.card.card_type === "儀式魔法"
                    ) {
                        // OCGルール準拠: 通常魔法・速攻魔法・儀式魔法も一旦魔法・罠ゾーンに置く
                        const targetZone = zone ?? findEmptySpellTrapZone(state);
                        if (targetZone === -1) {
                            // ゾーンが満杯の場合は発動できない
                            state.hand.push(card); // 手札に戻す
                            return;
                        }

                        // 一時的に魔法・罠ゾーンに配置（効果処理後に墓地へ送られる）
                        const updatedCard = {
                            ...card,
                            location: "field_spell_trap" as const,
                            zone: targetZone,
                            isActivating: true, // 発動中フラグ
                        };
                        state.field.spellTrapZones[targetZone] = updatedCard;
                    } else {
                        // 永続魔法・装備魔法は魔法・罠ゾーンへ
                        const targetZone = zone ?? findEmptySpellTrapZone(state);
                        if (targetZone === -1) return;

                        const updatedCard = {
                            ...card,
                            location: "field_spell_trap" as const,
                            zone: targetZone,
                        };
                        state.field.spellTrapZones[targetZone] = updatedCard;
                    }
                }

                state.selectedCard = null;
            });

            // set()の外で効果処理を実行
            if (
                isSpellCard(card.card) &&
                (card.card.card_type === "通常魔法" ||
                    card.card.card_type === "速攻魔法" ||
                    card.card.card_type === "儀式魔法" ||
                    card.card.card_type === "フィールド魔法")
            ) {
                // フィールドに配置されたカードの情報を取得して効果処理
                const currentState = get();
                let activatingCard = card;

                // 通常・速攻・儀式魔法の場合は、フィールドから情報を取得
                if (
                    card.card.card_type === "通常魔法" ||
                    card.card.card_type === "速攻魔法" ||
                    card.card.card_type === "儀式魔法"
                ) {
                    const fieldCard = currentState.field.spellTrapZones.find(
                        (zoneCard) => zoneCard && zoneCard.id === card.id && zoneCard.isActivating
                    );
                    if (fieldCard) {
                        activatingCard = fieldCard;
                    }
                }

                get().activateSpellEffect(activatingCard);
            }
        },

        setCard: (cardId: string, zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                return;
            }

            set((state) => {
                if (!canSetSpellTrap(state, card.card)) {
                    return;
                }

                // 手札から削除
                state.hand = state.hand.filter((c) => c.id !== cardId);

                // 魔法・罠ゾーンにセット（伏せ状態）
                const targetZone = zone ?? findEmptySpellTrapZone(state);
                if (targetZone === -1) return;

                const updatedCard = {
                    ...card,
                    location: "field_spell_trap" as const,
                    zone: targetZone,
                    position: "facedown" as const,
                    setTurn: state.turn, // セットしたターン番号を記録
                };
                state.field.spellTrapZones[targetZone] = updatedCard;

                state.selectedCard = null;
            });
        },

        summonMonster: (cardId: string, position: "attack" | "facedown_defense", zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                return;
            }

            set((state) => {
                if (!isMonsterCard(card.card)) return;
                if (!canNormalSummon(state, card)) return;

                const targetZone = zone ?? findEmptyMonsterZone(state);
                if (targetZone === -1) return;
                // 手札から削除
                helper.summonMonsterFromAnywhere(state, card);
            });
        },

        activateFieldCard: (cardId: string) => {
            const gameState = get();

            // フィールドにあるカードを探す
            const fieldCard =
                gameState.field.fieldZone?.id === cardId
                    ? gameState.field.fieldZone
                    : gameState.field.spellTrapZones.find((card) => card?.id === cardId) ||
                      gameState.field.monsterZones.find((card) => card?.id === cardId);

            if (!fieldCard) {
                return;
            }

            // チキンレースの効果はUI側で選択肢を表示して処理
            if (fieldCard.card.card_name === "チキンレース") {
                // 実際の効果はactivateChickenRaceEffect関数で処理
                return; // UI側で処理するため、ここでは何もしない
            }

            // 他のカードの効果もここに追加可能
        },

        activateSetCard: (cardId: string) => {
            const gameState = get();

            // フィールドにある伏せカードを探す
            let setCard: CardInstance | null = null;
            let zoneIndex = -1;

            // 魔法・罠ゾーンから伏せカードを探す
            for (let i = 0; i < gameState.field.spellTrapZones.length; i++) {
                const card = gameState.field.spellTrapZones[i];
                if (card?.id === cardId && card.position === "facedown") {
                    setCard = card;
                    zoneIndex = i;
                    break;
                }
            }

            if (!setCard) {
                return;
            }

            set((state) => {
                if (!setCard) return;

                // 魔法カードの場合
                if (isSpellCard(setCard.card)) {
                    // メインフェイズでのみ発動可能（速攻魔法は例外）
                    if (setCard.card.card_type !== "速攻魔法" && state.phase !== "main1" && state.phase !== "main2") {
                        return;
                    }

                    // 永続魔法・装備魔法以外は墓地へ
                    if (setCard.card.card_type === "通常魔法" || setCard.card.card_type === "速攻魔法") {
                        // ゾーンから削除
                        state.field.spellTrapZones[zoneIndex] = null;

                        // 墓地へ送る
                        const updatedCard = { ...setCard, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(updatedCard);

                        // 効果処理を実行
                        get().activateSpellEffect(setCard);
                    } else {
                        // 永続魔法・装備魔法は表向きにする
                        const updatedCard = { ...setCard, position: undefined };
                        state.field.spellTrapZones[zoneIndex] = updatedCard;
                    }

                    // TODO: カード固有の効果処理をここに追加
                } else if (isTrapCard(setCard.card)) {
                    // 罠カードはセットしたターンには発動できない
                    if (setCard.setTurn === state.turn) {
                        return;
                    }

                    // 補充要員の特別な発動条件チェック
                    if (setCard.card.card_name === "補充要員" && !canActivateHokyuYoin(state)) {
                        return;
                    }

                    // 通常罠は墓地へ、永続罠は表向きに
                    if (setCard.card.card_type === "通常罠カード") {
                        // ゾーンから削除
                        state.field.spellTrapZones[zoneIndex] = null;

                        // 墓地へ送る
                        const updatedCard = { ...setCard, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(updatedCard);
                    } else {
                        // 永続罠・カウンター罠は表向きにする
                        const updatedCard = { ...setCard, position: undefined };
                        state.field.spellTrapZones[zoneIndex] = updatedCard;
                    }

                    // TODO: カード固有の効果処理をここに追加
                }
            });
        },

        activateSpellEffect: (card: CardInstance) => {
            // 通常・速攻・儀式魔法の場合、効果処理後に墓地へ送る
            const shouldMoveToGraveyard =
                card.card.card_type === "通常魔法" ||
                card.card.card_type === "速攻魔法" ||
                card.card.card_type === "儀式魔法";

            set((state) => {
                switch (card.card.card_name) {
                    case "金満で謙虚な壺": {
                        state.hasActivatedExtravagance = true; // 金満で謙虚な壺を発動したフラグを立てる
                        state.effectQueue.unshift({
                            id: "",
                            type: "option",
                            effectName: "金満で謙虚な壺（エクストラデッキの除外枚数選択）",
                            cardInstance: card,
                            effectType: "option_extravagance",
                            option: [
                                { name: "3枚除外", value: "three" },
                                { name: "6枚除外", value: "six" },
                            ],
                            canCancel: false,
                        });
                        break;
                    }

                    case "ワン・フォー・ワン": {
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "ワン・フォーワン（墓地送り対象選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.hand.filter((c): c is CardInstance => {
                                    return isMonsterCard(c.card);
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "one_for_one_discard_hand",
                            canCancel: false,
                        });
                        break;
                    }

                    case "おろかな埋葬": {
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "おろかな埋葬（墓地送り対象選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    return isMonsterCard(c.card);
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "send_to_graveyard",
                            canCancel: true,
                        });
                        break;
                    }

                    case "ジャック・イン・ザ・ハンド": {
                        state.hasActivatedJackInTheHand = true;
                        state.effectQueue.unshift({
                            id: "",
                            type: "multiselect",
                            effectName: "ジャック・イン・ザ・ハンド（3体選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                // レベル1モンスターをデッキから取得
                                // 同名のカードは一枚までとする
                                return state.deck
                                    .filter((c): c is CardInstance => {
                                        return isMonsterCard(c.card) && (c.card as MonsterCard)?.level === 1;
                                    })
                                    .reduce<CardInstance[]>((prev, cur) => {
                                        if (!prev.some((c) => c.card.card_name === cur.card.card_name)) {
                                            prev.push(cur);
                                        }
                                        return prev;
                                    }, []);
                            },
                            condition: (cards: CardInstance[]) => {
                                // 3体選択かつ全て異なるカード名であることを確認
                                if (cards.length !== 3) return false;
                                const uniqueNames = new Set(cards.map((c) => c.card.card_name));
                                if (uniqueNames.size !== 3) return false;
                                return true;
                            },
                            effectType: "jack_in_hand_select_three",
                            canCancel: false,
                        });
                        break;
                    }

                    case "エマージェンシー・サイバー": {
                        // ターン1制限チェック（発動済みフラグを立てる）
                        state.hasActivatedEmergencyCyber = true;

                        // デッキから「サイバー・ドラゴン」モンスターまたは通常召喚できない機械族・光属性モンスターを選択
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "エマージェンシー・サイバー（モンスター選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    if (!isMonsterCard(c.card)) return false;
                                    const monster = c.card as MonsterCard;

                                    // サイバー・ドラゴンモンスター
                                    if (monster.card_name.includes("サイバー・ドラゴン")) return true;

                                    // 通常召喚できない機械族・光属性モンスター
                                    if (
                                        monster.race === "機械族" &&
                                        monster.attribute === "光属性" &&
                                        (monster.card_type === "特殊召喚・効果モンスター" ||
                                            c.card.text.includes("このカードは通常召喚できない"))
                                    ) {
                                        return true;
                                    }

                                    return false;
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "get_hand_single",
                            canCancel: false,
                        });
                        break;
                    }

                    case "極超の竜輝巧": {
                        // デッキから「ドライトロン」モンスター1体を特殊召喚
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "極超の竜輝巧（ドライトロン選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    if (!isMonsterCard(c.card)) return false;
                                    return (
                                        c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")
                                    );
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "special_summon_from_deck_with_destruction",
                            canCancel: false,
                        });
                        break;
                    }

                    case "テラ・フォーミング": {
                        // デッキからフィールド魔法カード1枚を手札に加える
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "テラ・フォーミング（フィールド魔法選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    return c.card.card_type === "フィールド魔法";
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "get_hand_single",
                            canCancel: false,
                        });
                        break;
                    }

                    case "盆回し": {
                        // デッキから異なるフィールド魔法を取得
                        const fieldSpells = state.deck.filter((c) => c.card.card_type === "フィールド魔法");

                        // 異なるカード名のフィールド魔法を取得
                        const uniqueFieldSpells: CardInstance[] = [];
                        const seenNames = new Set<string>();

                        for (const spell of fieldSpells) {
                            if (!seenNames.has(spell.card.card_name)) {
                                uniqueFieldSpells.push(spell);
                                seenNames.add(spell.card.card_name);
                            }
                        }

                        if (uniqueFieldSpells.length >= 2) {
                            // 2枚のフィールド魔法を選択するUIを表示
                            state.searchingEffect = {
                                cardName: "盆回し（フィールド魔法2枚選択）",
                                availableCards: uniqueFieldSpells,
                                effectType: "bonmawashi_select",
                            };
                        }
                        break;
                    }

                    case "竜輝巧－ファフニール": {
                        // ターンに1回制限フラグを設定
                        state.hasActivatedFafnir = true;

                        // 発動時効果：デッキから「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カードを手札に加える
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "竜輝巧－ファフニール（ドライトロン魔法・罠カード選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    const isSpellOrTrap =
                                        c.card.card_type.includes("魔法") || c.card.card_type.includes("罠");
                                    const isDrytron =
                                        c.card.card_name.includes("竜輝巧") ||
                                        c.card.card_name.includes("ドライトロン");
                                    const isNotFafnir = c.card.card_name !== "竜輝巧－ファフニール";
                                    return isSpellOrTrap && isDrytron && isNotFafnir;
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "add_to_hand_from_deck",
                            canCancel: true, // この効果は「できる」効果
                        });

                        // 注: ②の儀式魔法無効化されない効果は実装しない（ユーザーの指示により）
                        // 注: ③のレベル減少効果は常時効果のため、別途実装が必要
                        break;
                    }

                    case "儀式の準備": {
                        if (state.graveyard.some((c) => c.card.card_type === "儀式魔法")) {
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "儀式の準備（儀式魔法選択）",
                                cardInstance: card,
                                getAvailableCards: (state: GameStore) => {
                                    return state.graveyard.filter((c): c is CardInstance => {
                                        return c.card.card_type === "儀式魔法";
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "get_hand_single",
                                canCancel: true,
                            });
                        }

                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "儀式の準備（儀式モンスター選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.deck.filter((c): c is CardInstance => {
                                    return c.card.card_type === "儀式・効果モンスター";
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "get_hand_single",
                            canCancel: false,
                        });
                        break;
                    }

                    case "高等儀式術": {
                        // 手札から儀式モンスターを選択させる
                        state.effectQueue.unshift({
                            id: "",
                            type: "select",
                            effectName: "高等儀式術（儀式モンスター選択）",
                            cardInstance: card,
                            getAvailableCards: (state: GameStore) => {
                                return state.hand.filter((c): c is CardInstance => {
                                    return c.card.card_type === "儀式・効果モンスター";
                                });
                            },
                            condition: (cards: CardInstance[]) => {
                                return cards.length === 1;
                            },
                            effectType: "advanced_ritual_first_select",
                            canCancel: false,
                        });
                        break;
                    }

                    case "流星輝巧群": {
                        console.log("Activating Meteor Kikougun effect...");

                        // 手札・墓地から儀式モンスターを選択させる
                        const handRitualMonsters = state.hand.filter(
                            (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                        );
                        const graveyardRitualMonsters = state.graveyard.filter(
                            (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                        );

                        const allRitualMonsters = [...handRitualMonsters, ...graveyardRitualMonsters];

                        console.log(
                            "Available ritual monsters for Meteor Kikougun:",
                            allRitualMonsters.map((c) => c.card.card_name)
                        );

                        if (allRitualMonsters.length > 0) {
                            console.log("Setting up ritual monster selection UI");
                            state.meteorKikougunState = {
                                phase: "select_ritual_monster",
                                availableRitualMonsters: allRitualMonsters,
                            };
                            state.searchingEffect = {
                                cardName: "流星輝巧群（儀式モンスター選択）",
                                availableCards: allRitualMonsters,
                                effectType: "meteor_kikougun_select_monster",
                            };
                        } else {
                            console.log("No ritual monsters available for Meteor Kikougun");
                        }
                        break;
                    }
                }

                // 効果処理後に墓地送り処理を実行
                if (shouldMoveToGraveyard) {
                    // 発動中のカードをフィールドから探して墓地へ送る
                    for (let i = 0; i < state.field.spellTrapZones.length; i++) {
                        const zoneCard = state.field.spellTrapZones[i];
                        if (zoneCard && zoneCard.id === card.id && zoneCard.isActivating) {
                            // フィールドから削除
                            state.field.spellTrapZones[i] = null;
                            // 墓地へ送る
                            const graveyardCard = {
                                ...zoneCard,
                                location: "graveyard" as const,
                                zone: undefined,
                                isActivating: undefined,
                            };
                            state.graveyard.push(graveyardCard);
                            break;
                        }
                    }
                }
                // Immerでは明示的なreturnは不要（問題の原因かもしれない）
                // return state;
            });
        },

        selectForJackInHand: (selectedCards: CardInstance[]) => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "select_three") return;

                // 相手がランダムに1枚選択
                const randomIndex = Math.floor(Math.random() * selectedCards.length);
                const opponentCard = selectedCards[randomIndex];
                const remainingCards = selectedCards.filter((_, index) => index !== randomIndex);

                // 選択されたカードをデッキから除外
                selectedCards.forEach((card) => {
                    state.deck = state.deck.filter((c) => c.id !== card.id);
                });

                state.jackInHandState = {
                    phase: "player_selects",
                    availableCards: selectedCards,
                    selectedThree: selectedCards,
                    opponentCard: opponentCard,
                    remainingCards: remainingCards,
                };

                state.searchingEffect = null;
            });
        },

        continueJackInHand: () => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "opponent_takes") return;

                state.jackInHandState.phase = "player_selects";
            });
        },

        selectPlayerCardFromJack: (selectedCard: CardInstance) => {
            set((state) => {
                if (!state.jackInHandState || state.jackInHandState.phase !== "player_selects") return;

                // ジャック・イン・ザ・ハンドは「手札に加える」効果なので金満制限を受けない

                // プレイヤーが選択したカードを手札に加える
                const updatedCard = { ...selectedCard, location: "hand" as const };
                state.hand.push(updatedCard);
                // hasDrawnByEffectフラグは立てない（ドロー効果ではないため）

                // 残りのカードをデッキに戻してシャッフル
                const remainingCards =
                    state.jackInHandState.remainingCards?.filter((c) => c.id !== selectedCard.id) || [];
                remainingCards.forEach((card) => {
                    state.deck.push(card);
                });

                // デッキをシャッフル
                for (let i = state.deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
                }

                state.jackInHandState = null;
            });
        },

        selectExtravaganceCount: (count: 3 | 6) => {
            set((state) => {
                if (!state.extravaganceState || state.extravaganceState.phase !== "select_count") return;

                // EXデッキからカードを除外
                const actualCount = Math.min(count, state.extraDeck.length);
                for (let i = 0; i < actualCount; i++) {
                    const excludedCard = state.extraDeck.shift();
                    if (excludedCard) {
                        const updatedCard = { ...excludedCard, location: "banished" as const };
                        state.banished.push(updatedCard);
                    }
                }

                // 除外した数だけデッキの上からカードをめくる
                const revealedCards: CardInstance[] = [];
                const cardsToReveal = Math.min(actualCount, state.deck.length);

                for (let i = 0; i < cardsToReveal; i++) {
                    const revealedCard = state.deck.shift();
                    if (revealedCard) {
                        revealedCards.push(revealedCard);
                    }
                }

                if (revealedCards.length > 0) {
                    // カード選択フェーズに移行
                    state.extravaganceState = {
                        phase: "select_card_from_deck",
                        revealedCards: revealedCards,
                        banishedCount: actualCount,
                    };
                } else {
                    // めくるカードがない場合は終了
                    state.extravaganceState = null;
                }

                // TODO: ターン終了時まで相手が受ける全てのダメージは半分になる（実装省略）
            });
        },

        selectCardFromExtravagance: () => {
            // この関数は使用されなくなったが、互換性のため残しておく
            set((state) => {
                state.extravaganceState = null;
            });
        },

        selectCardFromRevealedCards: (selectedCard: CardInstance, remainingCards: CardInstance[]) => {
            set((state) => {
                if (!state.extravaganceState || state.extravaganceState.phase !== "select_card_from_deck") return;

                // 選択されたカードを手札に加える
                const cardToHand = { ...selectedCard, location: "hand" as const };
                state.hand.push(cardToHand);
                state.hasDrawnByEffect = true; // カードの効果で手札に加えたフラグを立てる

                // 残りのカードをデッキの一番下に戻す
                remainingCards.forEach((card) => {
                    state.deck.push(card);
                });

                // 効果終了
                state.extravaganceState = null;

                // エクゾディア勝利判定（デバッグ用に一時無効）
                // if (checkExodiaWin(state.hand)) {
                //     state.gameOver = true;
                //     state.winner = "player";
                // }
            });
        },

        activateChickenRaceEffect: (effectType: "draw" | "destroy" | "heal") => {
            set((state) => {
                // このターンに既に効果を使用している場合は実行できない
                if (state.hasActivatedChickenRace) {
                    return;
                }

                // 1000LP支払い（ライフポイントが1000以下になる場合は支払えない）
                if (state.lifePoints > 1000) {
                    state.lifePoints -= 1000;
                    state.hasActivatedChickenRace = true; // フラグを設定

                    switch (effectType) {
                        case "draw":
                            // 金満で謙虚な壺を発動したターンは効果でドローできない
                            if (state.hasActivatedExtravagance) {
                                break;
                            }

                            // 1枚ドロー
                            if (state.deck.length > 0) {
                                const drawnCard = state.deck.shift();
                                if (drawnCard) {
                                    drawnCard.location = "hand";
                                    state.hand.push(drawnCard);
                                    state.hasDrawnByEffect = true; // カードの効果でドローしたフラグを立てる
                                }
                            }
                            break;

                        case "destroy":
                            // チキンレースを破壊（自分のフィールドまたは相手のフィールドから）
                            if (state.field.fieldZone && state.field.fieldZone.card.card_name === "チキンレース") {
                                const destroyedCard = { ...state.field.fieldZone, location: "graveyard" as const };
                                state.graveyard.push(destroyedCard);

                                // 盆回し制限チェック
                                if (destroyedCard.setByBonmawashi) {
                                    // 盆回しでセットされたフィールド魔法がフィールドから離れた場合の制限チェック
                                    const opponentFieldHasBonmawashi =
                                        state.opponentField.fieldZone?.setByBonmawashi || false;

                                    // 相手フィールドにも盆回しカードがない場合、制限を解除
                                    if (!opponentFieldHasBonmawashi) {
                                        state.bonmawashiRestriction = false;
                                    }
                                }

                                state.field.fieldZone = null;
                            } else if (
                                state.opponentField.fieldZone &&
                                state.opponentField.fieldZone.card.card_name === "チキンレース"
                            ) {
                                const destroyedCard = {
                                    ...state.opponentField.fieldZone,
                                    location: "graveyard" as const,
                                };
                                state.graveyard.push(destroyedCard);

                                // 盆回し制限チェック
                                if (destroyedCard.setByBonmawashi) {
                                    // 盆回しでセットされたフィールド魔法がフィールドから離れた場合の制限チェック
                                    const playerFieldHasBonmawashi = state.field.fieldZone?.setByBonmawashi || false;

                                    // プレイヤーフィールドにも盆回しカードがない場合、制限を解除
                                    if (!playerFieldHasBonmawashi) {
                                        state.bonmawashiRestriction = false;
                                    }
                                }

                                state.opponentField.fieldZone = null;
                            }
                            break;

                        case "heal":
                            // 相手は1000LP回復（簡易実装では何もしない）
                            break;
                    }

                    // ライフポイントが0以下になったらゲーム終了
                    if (state.lifePoints <= 0) {
                        state.gameOver = true;
                        state.winner = null; // 自滅
                    }
                }
            });
        },

        setPhase: (phase: GamePhase) => {
            set((state) => {
                state.phase = phase;
            });
        },

        activateTrapCard: (card: CardInstance) => {
            set((state) => {
                if (card.card.card_name === "補充要員") {
                    // 発動条件の再チェック
                    if (!canActivateHokyuYoin(state)) {
                        state.pendingTrapActivation = null;
                        return;
                    }

                    // 補充要員の効果: 墓地から効果モンスター以外の攻撃力1500以下のモンスターを3体まで選択
                    const targetMonsters = state.graveyard.filter((c) => {
                        if (!isMonsterCard(c.card)) return false;
                        const monster = c.card as { card_type?: string; attack?: number };
                        return monster.card_type !== "効果モンスター" && (monster.attack || 0) <= 1500;
                    });

                    if (targetMonsters.length > 0) {
                        // 補充要員の選択状態を設定
                        state.hokyuyoinState = {
                            availableCards: targetMonsters,
                        };
                    }

                    // カードをフィールドから墓地へ
                    const cardIndex = state.field.spellTrapZones.findIndex((c) => c?.id === card.id);
                    if (cardIndex !== -1) {
                        state.field.spellTrapZones[cardIndex] = null;
                        const graveyardCard = { ...card, location: "graveyard" as const, position: undefined };
                        state.graveyard.push(graveyardCard);
                    }
                }

                state.pendingTrapActivation = null;
            });
        },

        declineTrapActivation: () => {
            set((state) => {
                state.pendingTrapActivation = null;
            });
        },

        selectHokyuyoinTargets: (selectedCards: CardInstance[]) => {
            set((state) => {
                // 選択されたカードを墓地から手札に移動
                selectedCards.forEach((card) => {
                    state.graveyard = state.graveyard.filter((c) => c.id !== card.id);
                    const updatedCard = { ...card, location: "hand" as const };
                    state.hand.push(updatedCard);
                });

                // サーチ効果を終了
                state.searchingEffect = null;
                state.hokyuyoinState = null;
            });
        },

        selectBonmawashiCards: (selectedCards: CardInstance[]) => {
            set((state) => {
                if (selectedCards.length !== 2) {
                    return;
                }

                // 選択された2枚をデッキから削除
                selectedCards.forEach((card) => {
                    state.deck = state.deck.filter((c) => c.id !== card.id);
                });

                // 盆回しの状態を更新し、プレイヤーに自分用を選択させる
                state.bonmawashiState = {
                    phase: "select_for_player",
                    selectedCards: selectedCards,
                };

                // 選択UIを表示
                state.searchingEffect = {
                    cardName: "盆回し（自分のフィールドにセットするカードを選択）",
                    availableCards: selectedCards,
                    effectType: "bonmawashi_player_select",
                };
            });
        },

        selectBonmawashiForPlayer: (card: CardInstance) => {
            set((state) => {
                if (!state.bonmawashiState || state.bonmawashiState.phase !== "select_for_player") return;
                if (!state.bonmawashiState.selectedCards || state.bonmawashiState.selectedCards.length !== 2) return;

                const otherCard = state.bonmawashiState.selectedCards.find((c) => c.id !== card.id);
                if (!otherCard) return;

                // 既存のフィールド魔法を墓地へ
                if (state.field.fieldZone) {
                    const oldFieldCard = { ...state.field.fieldZone, location: "graveyard" as const };
                    state.graveyard.push(oldFieldCard);
                }

                // 選択したカードを自分のフィールドに表側で発動
                const setSpell = {
                    ...card,
                    location: "field_spell_trap" as const,
                    setByBonmawashi: true, // 盆回しでセットされたことを記録
                };
                state.field.fieldZone = setSpell;

                // 自分のフィールドに配置されたカードの発動時効果を処理
                if (card.card.card_name === "竜輝巧－ファフニール") {
                    // ファフニールの発動時効果を後で実行
                    setTimeout(() => {
                        const currentState = get();
                        if (!currentState.hasActivatedFafnir) {
                            get().activateSpellEffect(card);
                        }
                    }, 0);
                }

                // 相手のフィールドにもう1枚を表側で発動
                const opponentSetSpell = {
                    ...otherCard,
                    location: "field_spell_trap" as const,
                    setByBonmawashi: true, // 盆回しでセットされたことを記録
                };
                state.opponentField.fieldZone = opponentSetSpell;

                // 盆回し制限を適用
                state.bonmawashiRestriction = true;

                // 状態をクリア
                state.bonmawashiState = null;
                state.searchingEffect = null;
            });
        },

        checkBonmawashiRestriction: () => {
            set((state) => {
                // 盆回しでセットされたフィールド魔法がまだフィールドに存在するかチェック
                const playerFieldHasBonmawashi = state.field.fieldZone?.setByBonmawashi || false;
                const opponentFieldHasBonmawashi = state.opponentField.fieldZone?.setByBonmawashi || false;

                // どちらもフィールドにない場合、制限を解除
                if (!playerFieldHasBonmawashi && !opponentFieldHasBonmawashi) {
                    state.bonmawashiRestriction = false;
                }
            });
        },

        activateOpponentFieldSpell: () => {
            set((state) => {
                if (!state.opponentField.fieldZone || state.opponentField.fieldZone.position !== "facedown") {
                    return;
                }

                // 表側にする
                state.opponentField.fieldZone.position = undefined;

                // TODO: フィールド魔法の効果処理（チキンレースなど）
            });
        },

        activateBanAlpha: (banAlphaCard: CardInstance) => {
            // このターンに既に発動済みの場合は発動不可
            const currentState = get();
            if (currentState.hasActivatedBanAlpha) {
                return;
            }
            set((state) => {
                // バンαの効果を発動済みとしてマーク（UIが表示される前に設定）
                state.hasActivatedBanAlpha = true;
                state.effectQueue.unshift({
                    id: "",
                    type: "select",
                    effectName: "竜輝巧－バンα（リリース対象選択）",
                    cardInstance: banAlphaCard,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.hand, ...state.field.monsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            if (!isMonsterCard(c.card)) return false;
                            const isDrytron =
                                (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
                                c.card.card_name !== "竜輝巧－バンα";
                            const isRitual = c.card.card_type === "儀式・効果モンスター";
                            return isDrytron || isRitual;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return cards.length === 1; // リリース対象が1枚選択された場合のみ有効
                    },
                    effectType: "ban_alpha_release_select",
                    canCancel: true,
                });
            });
        },
        activateEruGanma: (EruGanmaCard: CardInstance) => {
            // このターンに既に発動済みの場合は発動不可
            const currentState = get();
            if (currentState.hasActivatedEruGanma) {
                return;
            }

            set((state) => {
                state.hasActivatedEruGanma = true;
                state.effectQueue.unshift({
                    id: "",
                    type: "select",
                    effectName: "竜輝巧－エルγ（リリース対象選択）",
                    cardInstance: EruGanmaCard,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.hand, ...state.field.monsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            if (!isMonsterCard(c.card)) return false;
                            const isDrytron =
                                (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
                                c.card.card_name !== "竜輝巧－エルγ";
                            const isRitual = c.card.card_type === "儀式・効果モンスター";

                            return isDrytron || isRitual;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return cards.length === 1; // リリース対象が1枚以上選択された場合のみ有
                    },
                    effectType: "eru_ganma_release_select",
                    canCancel: true,
                });
            });
        },
        activateAruZeta: (aruZetaCard: CardInstance) => {
            // このターンに既に発動済みの場合は発動不可
            const currentState = get();
            if (currentState.hasActivatedAruZeta) {
                return;
            }
            set((state) => {
                state.hasActivatedAruZeta = true;
                state.effectQueue.unshift({
                    id: "",
                    type: "select",
                    effectName: "竜輝巧－アルζ（リリース対象選択）",
                    cardInstance: aruZetaCard,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.hand, ...state.field.monsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            if (!isMonsterCard(c.card)) return false;
                            const isDrytron =
                                (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
                                c.card.card_name !== "竜輝巧－アルζ";
                            const isRitual = c.card.card_type === "儀式・効果モンスター";
                            return isDrytron || isRitual;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return cards.length === 1; // リリース対象が1枚以上選択された場合のみ有
                    },
                    effectType: "aru_zeta_release_select",
                    canCancel: true,
                });
            });
        },
        checkCritterEffect: (card: CardInstance) => {
            const currentState = get();

            // クリッターかどうかチェック
            if (card.card.card_name !== "クリッター") {
                return;
            }

            // フィールドから墓地へ送られたかチェック
            if (card.location !== "field_monster") {
                return;
            }

            // このターンに既に発動済みかチェック
            if (currentState.hasActivatedCritter) {
                return;
            }

            // 攻撃力1500以下のモンスターを探す
            const targetMonsters = currentState.deck.filter((c) => {
                if (!isMonsterCard(c.card)) return false;
                const monster = c.card as { attack?: number };
                return (monster.attack || 0) <= 1500;
            });

            if (targetMonsters.length > 0) {
                set((state) => {
                    state.hasActivatedCritter = true;
                    state.searchingEffect = {
                        cardName: "クリッター",
                        availableCards: targetMonsters,
                        effectType: "critter_search",
                    };
                });
            }
        },

        startLinkSummon: (linkMonster: CardInstance) => {
            const currentState = get();

            // リンクモンスターの要求素材数を取得
            const linkCard = linkMonster.card as { link?: number; material?: string };
            const requiredMaterials = linkCard.link || 1;

            // 利用可能な素材を取得（フィールドのモンスター）
            const availableMaterials = currentState.field.monsterZones.filter((c): c is CardInstance => c !== null);

            if (availableMaterials.length < requiredMaterials) {
                return;
            }

            set((state) => {
                state.effectQueue.unshift({
                    id: "",
                    type: "multiselect",
                    effectName: `${linkMonster.card.card_name}（素材選択）`,
                    cardInstance: linkMonster,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            return true;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return (
                            cards.reduce((prev, cur) => prev + ((cur.card as { link?: number }).link ?? 1), 0) ===
                            requiredMaterials
                        );
                    },
                    effectType: "link_summon_select_materials",
                    canCancel: true,
                });
            });
        },

        selectLinkMaterials: (materials: CardInstance[]) => {
            const currentState = get();

            if (!currentState.linkSummonState || currentState.linkSummonState.phase !== "select_materials") {
                return;
            }

            const { linkMonster, requiredMaterials } = currentState.linkSummonState;

            if (!linkMonster || materials.length !== requiredMaterials) {
                return;
            }

            set((state) => {
                let clearedSearchEffect = false;
                materials.forEach((material) => {
                    const zoneIndex = state.field.monsterZones.findIndex((c) => c?.id === material.id);
                    if (zoneIndex !== -1) {
                        clearedSearchEffect = helper.sendMonsterToGraveyardInternal(state, material, "field");
                    }
                });

                // エクストラデッキからリンクモンスターを削除
                state.extraDeck = state.extraDeck.filter((c) => c.id !== linkMonster.id);

                // エクストラモンスターゾーン選択フェーズに移行
                state.linkSummonState = {
                    phase: "select_materials", // 実際にはゾーン選択だが、既存の型定義を使用
                    linkMonster: linkMonster,
                    requiredMaterials: requiredMaterials,
                    selectedMaterials: materials,
                    availableMaterials: [],
                };

                // サーチ効果をクリア（UI側でゾーン選択を処理）
                state.searchingEffect = clearedSearchEffect ? state.searchingEffect : null;
            });
        },

        summonLinkMonster: (zone: number) => {
            const currentState = get();

            if (!currentState.linkSummonState) {
                return;
            }

            const { linkMonster } = currentState.linkSummonState;

            if (!linkMonster) {
                return;
            }

            // エクストラモンスターゾーンに配置（zone 5 = 左、zone 6 = 右）
            const extraZoneIndex = zone === 5 ? 0 : 1;

            if (currentState.field.extraMonsterZones[extraZoneIndex] !== null) {
                return;
            }

            set((state) => {
                const summonedMonster = {
                    ...linkMonster,
                    location: "field_monster" as const,
                    position: "attack" as const,
                    zone: zone,
                };

                // エクストラモンスターゾーンに配置
                const newExtraZones = [...state.field.extraMonsterZones];
                newExtraZones[extraZoneIndex] = summonedMonster;
                state.field.extraMonsterZones = newExtraZones;

                // リンク召喚状態をクリア
                state.linkSummonState = null;
                state.hasSpecialSummoned = true;
            });

            // リンクモンスターの召喚成功時効果を処理
            setTimeout(() => {
                const postSummonState = get();
                const summonedCard = postSummonState.field.extraMonsterZones[extraZoneIndex];

                if (summonedCard && summonedCard.card.card_name === "リンクリボー") {
                    // リンクリボーの①効果：デッキからレベル1モンスター1体を墓地へ送る
                    set((state) => {
                        const level1Monsters = state.deck.filter((c) => {
                            if (!isMonsterCard(c.card)) return false;
                            const monster = c.card as { level?: number };
                            return monster.level === 1;
                        });

                        if (level1Monsters.length > 0) {
                            state.searchingEffect = {
                                cardName: "リンクリボー（レベル1モンスター選択）",
                                availableCards: level1Monsters,
                                effectType: "link_riboh_mill",
                            };
                        }
                    });
                }
            }, 100);
        },

        startXyzSummon: (xyzMonster: CardInstance) => {
            set((state) => {
                const rank = (xyzMonster.card as { rank?: number })?.rank;
                state.effectQueue.unshift({
                    id: "",
                    type: "multiselect",
                    effectName: `${xyzMonster.card.card_name}（素材選択）`,
                    cardInstance: xyzMonster,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            return (c.card as { level?: number })?.level === rank;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return cards.length === 2;
                    },
                    effectType: "xyz_summon_select_materials",
                    canCancel: true,
                });
            });
        },

        selectXyzMaterials: (materials: CardInstance[]) => {
            const currentState = get();

            if (!currentState.xyzSummonState || currentState.xyzSummonState.phase !== "select_materials") {
                return;
            }

            const { xyzMonster, requiredMaterials } = currentState.xyzSummonState;

            if (!xyzMonster || materials.length !== requiredMaterials) {
                return;
            }

            // 素材をフィールドから墓地へ送る
            set((state) => {
                materials.forEach((material) => {
                    helper.sendMonsterToGraveyardInternalAnywhere(state, material);
                });

                // エクストラデッキからエクシーズモンスターを削除
                state.extraDeck = state.extraDeck.filter((c) => c.id !== xyzMonster.id);

                // モンスターゾーン選択フェーズに移行
                state.xyzSummonState = {
                    phase: "select_materials", // 実際にはゾーン選択だが、既存の型定義を使用
                    xyzMonster: xyzMonster,
                    requiredRank: state.xyzSummonState!.requiredRank,
                    requiredMaterials: requiredMaterials,
                    selectedMaterials: materials,
                    availableMaterials: [],
                };

                // サーチ効果をクリア（UI側でゾーン選択を処理）
                state.searchingEffect = null;
            });
        },

        summonXyzMonster: (zone: number) => {
            const currentState = get();

            if (!currentState.xyzSummonState) {
                return;
            }

            const { xyzMonster } = currentState.xyzSummonState;

            if (!xyzMonster) {
                return;
            }

            // 通常のモンスターゾーンまたはエクストラモンスターゾーンに配置
            if (zone >= 5) {
                // エクストラモンスターゾーン（zone 5 = 左、zone 6 = 右）
                const extraZoneIndex = zone === 5 ? 0 : 1;

                if (currentState.field.extraMonsterZones[extraZoneIndex] !== null) {
                    return;
                }

                set((state) => {
                    const summonedMonster = {
                        ...xyzMonster,
                        location: "field_monster" as const,
                        position: "attack" as const,
                        zone: zone,
                    };

                    // エクストラモンスターゾーンに配置
                    const newExtraZones = [...state.field.extraMonsterZones];
                    newExtraZones[extraZoneIndex] = summonedMonster;
                    state.field.extraMonsterZones = newExtraZones;

                    // エクシーズ召喚状態をクリア
                    state.xyzSummonState = null;
                    state.hasSpecialSummoned = true;
                });

                // ファフニューベータの登場時効果をチェック
                if (xyzMonster.card.card_name === "竜輝巧－ファフμβ'") {
                    get().checkFafnirMuBetaXyzSummonEffect();
                }
            } else {
                // 通常のモンスターゾーン
                if (currentState.field.monsterZones[zone] !== null) {
                    return;
                }

                set((state) => {
                    const summonedMonster = {
                        ...xyzMonster,
                        location: "field_monster" as const,
                        position: "attack" as const,
                        zone: zone,
                    };

                    // 通常モンスターゾーンに配置
                    state.field.monsterZones[zone] = summonedMonster;

                    // エクシーズ召喚状態をクリア
                    state.xyzSummonState = null;
                    state.hasSpecialSummoned = true;
                });

                // ファフニューベータの登場時効果をチェック
                if (xyzMonster.card.card_name === "竜輝巧－ファフμβ'") {
                    get().checkFafnirMuBetaXyzSummonEffect();
                }
            }
        },

        checkFafnirMuBetaXyzSummonEffect: () => {
            const state = get();

            // デッキからドライトロンカードを探す
            const drytronCards = state.deck.filter(
                (c) => c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")
            );

            if (drytronCards.length === 0) {
                return;
            }

            // カード選択UIを表示
            set((state) => {
                state.searchingEffect = {
                    cardName: "竜輝巧－ファフμβ'の登場時効果",
                    availableCards: drytronCards,
                    effectType: "fafnir_mu_beta_xyz_summon",
                };
            });
        },

        checkFafnirMuBetaGraveyardEffect: (card: CardInstance) => {
            const state = get();
            // ファフμβ'でない場合は何もしない
            if (card.card.card_name !== "竜輝巧－ファフμβ'") {
                return;
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
                console.log("No Drytron monsters found, effect cannot activate");
                return;
            }

            console.log("Showing Fafnir μβ graveyard effect selection UI");
            // カード選択UIを表示
            set((state) => {
                state.searchingEffect = {
                    cardName: "竜輝巧－ファフμβ'の墓地送り時効果",
                    availableCards: allDrytronMonsters,
                    effectType: "fafnir_mu_beta_graveyard",
                };
            });
        },

        activateMeteorKikougun: (card: CardInstance) => {
            // 流星輝巧群の発動処理は activateSpellEffect で行われる
            get().activateSpellEffect(card);
        },

        selectBanAlphaRitualMonster: (ritualMonster: CardInstance) => {
            set((state) => {
                helper.selectBanAlphaRitualMonster(state, ritualMonster);
            });
        },

        selectEruGanmaGraveyardMonster: (monster: CardInstance) => {
            set((state) => {
                helper.selectEruGanmaGraveyardMonster(state, monster);
            });
        },

        // Effect Queue System
        addEffectToQueue: (effect: EffectQueueItem) => {
            set((state) => {
                state.effectQueue.push(effect);
            });
        },

        processQueueTop: (payload) => {
            if (payload.type === "cardSelect") {
                const selectedCard = payload.cardList;
                set((state) => {
                    if (state.effectQueue.length === 0) return;

                    const currentEffect = state.effectQueue[0];
                    state.effectQueue.shift(); // Remove the processed effect

                    // Process the effect based on its type
                    switch (currentEffect.effectType) {
                        case "clitter_effect_search":
                            helper.toHandFromAnywhere(state, selectedCard[0]);
                            state.hasActivatedCritter = true;
                            break;
                        case "ban_alpha_release_select":
                            // リリース対象を墓地へ送る
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0], "release");
                            helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance);
                            // バンαの効果を適用
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "竜輝巧－バンα（儀式モンスター選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.filter((c): c is CardInstance => {
                                        if (!c || !isMonsterCard(c.card)) return false;
                                        const isRitual = c.card.card_type === "儀式・効果モンスター";
                                        return isRitual;
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "get_hand_single",
                                canCancel: true,
                            });
                            break;
                        case "send_to_graveyard":
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0]);
                            break;
                        case "ban_alpha_ritual_select":
                            helper.selectBanAlphaRitualMonster(state, selectedCard[0]);
                            break;
                        case "eru_ganma_graveyard_select":
                            helper.summonMonsterFromAnywhere(state, selectedCard[0]);
                            break;
                        case "get_hand_single":
                            helper.toHandFromAnywhere(state, selectedCard[0]);
                            break;
                        case "release_summon":
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0]);
                            helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance);
                            break;
                        case "special_summon":
                            helper.summonMonsterFromAnywhere(state, selectedCard[0]);
                            break;
                        case "eru_ganma_release_select": {
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0], "release");
                            helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance);
                            const target = state.graveyard.filter((c): c is CardInstance => {
                                if (!c || !isMonsterCard(c.card)) return false;
                                const isDrytron =
                                    (c.card.card_name.includes("竜輝巧") ||
                                        c.card.card_name.includes("ドライトロン")) &&
                                    c.card.card_name !== "竜輝巧－エルγ" &&
                                    (c.card as MonsterCard)?.attack === 2000;
                                return isDrytron;
                            });
                            if (target.length > 0) {
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "select",
                                    effectName: "竜輝巧－エルγ（召喚対象選択）",
                                    cardInstance: currentEffect.cardInstance,
                                    getAvailableCards: () => target,
                                    condition: (cards: CardInstance[]) => {
                                        return cards.length === 1;
                                    },
                                    effectType: "special_summon",
                                    canCancel: true,
                                });
                            }
                            break;
                        }
                        case "aru_zeta_release_select": {
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0], "release");
                            helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance);
                            const target = state.deck.filter((c) => {
                                return c.card.card_type === "儀式魔法";
                            });
                            if (target.length > 0) {
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "select",
                                    effectName: "竜輝巧－アルζ（儀式魔法選択）",
                                    cardInstance: currentEffect.cardInstance,
                                    getAvailableCards: (state) =>
                                        state.deck.filter((c) => {
                                            return c.card.card_type === "儀式魔法";
                                        }),
                                    condition: (cards: CardInstance[]) => {
                                        return cards.length === 1;
                                    },
                                    effectType: "get_hand_single",
                                    canCancel: true,
                                });
                            }
                            break;
                        }

                        case "jack_in_hand_select_three": {
                            // selectedCardの3つの要素のうちランダムに一つを除外する
                            const card = selectedCard[Math.floor(Math.random() * selectedCard.length)];
                            // 手札から選択されたカードを削除
                            const restCard = selectedCard.filter((c) => c.id !== card.id);
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "ジャック・イン・ザ・ハンド（1体選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: () => {
                                    return restCard;
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1; // 1枚選択された場合のみ有効
                                },
                                effectType: "get_hand_single",
                                canCancel: false,
                            });
                            break;
                        }
                        case "ritual_summon":
                            helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance);
                            selectedCard.forEach((e) => helper.sendMonsterToGraveyardInternalAnywhere(state, e));
                            break;
                        case "add_to_hand_from_deck": {
                            // デッキから選択したカードを手札に加える
                            const selectedFromDeck = selectedCard[0];
                            if (selectedFromDeck) {
                                // デッキから削除
                                const deckIndex = state.deck.findIndex((c) => c.id === selectedFromDeck.id);
                                if (deckIndex !== -1) {
                                    state.deck.splice(deckIndex, 1);
                                    // 手札に加える
                                    state.hand.push(selectedFromDeck);
                                }
                            }
                            break;
                        }
                        case "special_summon_from_deck_with_destruction": {
                            // デッキから選択したモンスターを特殊召喚（エンドフェイズに破壊）
                            const selectedMonster = selectedCard[0];
                            if (selectedMonster) {
                                // helperを使って特殊召喚
                                helper.summonMonsterFromAnywhere(state, selectedMonster);
                                // エンドフェイズに破壊されるフラグを設定
                                // TODO: エンドフェイズ破壊の実装が必要
                                // 現在の実装では、summonMonsterFromAnywhereの後にフラグを設定する方法がないため、
                                // 別途エンドフェイズ処理の実装が必要
                            }
                            break;
                        }
                        case "advanced_ritual_first_select": {
                            const targetLevel = (selectedCard[0].card as { level?: number }).level ?? 0;
                            console.log("target", targetLevel);
                            state.effectQueue.unshift({
                                id: "",
                                type: "multiselect",
                                effectName: "高等儀式術（リリースモンスター選択）",
                                cardInstance: selectedCard[0],
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.filter((c): c is CardInstance => {
                                        return (
                                            c.card.card_type === "通常モンスター" ||
                                            c.card.card_type === "通常モンスター（チューナー）"
                                        );
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    const sumLevel = cards.reduce(
                                        (prev, cur) => ((cur.card as { level?: number })?.level ?? 0) + prev,
                                        0
                                    );

                                    return sumLevel === targetLevel;
                                },
                                effectType: "ritual_summon",
                                canCancel: false,
                            });
                            break;
                        }
                        case "meteor_first_select": {
                            const targetPower = (selectedCard[0].card as { attack?: number }).attack ?? 0;
                            console.log("target", targetPower);
                            state.effectQueue.unshift({
                                id: "",
                                type: "multiselect",
                                effectName: "高等儀式術（リリースモンスター選択）",
                                cardInstance: selectedCard[0],
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.filter((c): c is CardInstance => {
                                        return (
                                            c.card.card_type === "通常モンスター" ||
                                            c.card.card_type === "通常モンスター（チューナー）"
                                        );
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    console.log(cards);
                                    const sumPower = cards.reduce(
                                        (prev, cur) => ((cur.card as { attack?: number })?.attack ?? 0) + prev,
                                        0
                                    );
                                    console.log(sumPower, targetPower);

                                    return (
                                        sumPower >= targetPower &&
                                        cards.every((card) => {
                                            const pow = (card.card as { attack?: number })?.attack ?? 0;
                                            return sumPower - pow < targetPower;
                                        })
                                    );
                                },
                                effectType: "ritual_summon",
                                canCancel: false,
                            });
                            break;
                        }
                        case "xyz_summon_select_materials": {
                            const xyzMonster = currentEffect.cardInstance;
                            selectedCard.forEach((e) => helper.sendMonsterToGraveyardInternalAnywhere(state, e));
                            helper.summonMonsterFromAnywhere(state, xyzMonster);
                            break;
                        }
                        case "link_summon_select_materials": {
                            selectedCard.forEach((e) => helper.sendMonsterToGraveyardInternalAnywhere(state, e));
                            state.effectQueue.unshift({
                                id: "",
                                type: "link_summon",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "link_summon",
                            });
                            break;
                        }
                        case "one_for_one_discard_hand": {
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0]);
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "ワン・フォーワン（特殊召喚対象選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    return [...state.hand, ...state.deck].filter((c): c is CardInstance => {
                                        return getLevel(c) === 1;
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "special_summon",
                                canCancel: false,
                            });

                            break;
                        }
                        default:
                            console.warn("Unknown effect type:", currentEffect.effectType);
                            break;
                    }
                });
            } else if (payload.type === "option") {
                set((state) => {
                    if (state.effectQueue.length === 0) return;
                    const currentEffect = state.effectQueue[0];
                    state.effectQueue.shift(); // Remove the processed effect

                    switch (currentEffect.effectType) {
                        case "option_extravagance": {
                            const exclude = payload.option[0].value === "three" ? 3 : 6;
                            // エクストラデッキからランダムにexclude枚除外する
                            const target = state.extraDeck
                                .map((e) => ({ id: e.id, rand: Math.random() }))
                                .sort((a, b) => a.rand - b.rand)
                                .map((e) => e.id)
                                .slice(0, exclude);
                            state.extraDeck = state.extraDeck.filter((e) => !target.includes(e.id));
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "金満で謙虚な壺（対象選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.slice(0, exclude)!;
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "get_hand_single",
                                canCancel: false,
                            });
                            break;
                        }
                        case "fafnir_summon_effect_option": {
                            if (payload.option[0].value === "use") {
                                state.hasActivatedFafnirSummonEffect = true;
                                const id = currentEffect.cardInstance.id;
                                const extraIndex = state.field.extraMonsterZones.findIndex((e) => e?.id === id);
                                if (extraIndex !== -1) {
                                    state.field.extraMonsterZones[extraIndex]!.buf.level -= Math.floor(
                                        getAttack(state.field.extraMonsterZones[extraIndex]!) / 1000
                                    );
                                }
                                const monsterIndex = state.field.monsterZones.findIndex((e) => e?.id === id);
                                if (monsterIndex !== -1) {
                                    state.field.monsterZones[monsterIndex]!.buf.level -= Math.floor(
                                        getAttack(state.field.monsterZones[monsterIndex]!) / 1000
                                    );
                                    return;
                                }
                            }
                            break;
                        }
                    }
                });
            } else if (payload.type === "summon") {
                set((state) => {
                    if (state.effectQueue.length === 0) return;
                    const currentEffect = state.effectQueue[0];
                    state.effectQueue.shift(); // Remove the processed effect
                    helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance, payload.zone);
                });
            }
        },

        clearQueue: () => {
            set((state) => {
                state.effectQueue = [];
            });
        },

        // Keep searchingEffect for backward compatibility during migration
        searchingEffect: null,
    }))
);
