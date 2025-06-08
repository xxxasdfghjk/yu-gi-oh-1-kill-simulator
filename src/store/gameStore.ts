import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, GamePhase } from "@/types/game";
import { loadDeckData } from "@/data/cardLoader";
import { createCardInstance, shuffleDeck, drawCards, isMonsterCard, isSpellCard, getLevel } from "@/utils/gameUtils";
import { canNormalSummon, findEmptySpellTrapZone, canSetSpellTrap, canActivateHokyuYoin } from "@/utils/summonUtils";
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
          type: "summon";
          cardInstance: CardInstance;
          effectType: string;
          canSelectPosition: boolean;
          optionPosition: ("attack" | "defense" | "facedown" | "facedown_defense")[];
      }
    | {
          id: string;
          type: "activate_spell";
          cardInstance: CardInstance;
          effectType: string;
      }
    | {
          id: string;
          type: "spell_end";
          cardInstance: CardInstance;
          effectType: string;
      };

export interface GameStore extends GameState {
    initializeGame: () => void;
    drawCard: (count?: number) => void;
    nextPhase: () => void;
    playCard: (cardId: string, zone?: number) => void;
    setCard: (cardId: string, zone?: number) => void;
    activateChickenRaceEffect: (effectType: "draw" | "destroy" | "heal") => void;
    setPhase: (phase: GamePhase) => void;
    startLinkSummon: (linkMonster: CardInstance) => void;
    startXyzSummon: (xyzMonster: CardInstance) => void;
    effectQueue: EffectQueueItem[];
    sendSpellToGraveyard: (card: CardInstance) => void;
    addEffectToQueue: (effect: EffectQueueItem) => void;
    processQueueTop: (
        payload:
            | { type: "cardSelect"; cardList: CardInstance[] }
            | { type: "option"; option: { name: string; value: string }[] }
            | { type: "summon"; zone: number; position: "attack" | "defense" | "facedown" | "facedown_defense" }
            | { type: "activate_spell" }
    ) => void;
    clearQueue: () => void;
    popQueue: () => void;
    activateDreitrons: (dreitrons: CardInstance) => void;
    selectedCard: string | null;
    // 個別のサーチ効果状態
    hokyuyoinState: {
        availableCards: CardInstance[];
    } | null;
    bonmawashiState: {
        phase: "select_two" | "select_for_player";
        selectedCards?: CardInstance[];
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
    hasActivatedDreitronNova: false,
    hasActivatedDivinerSummonEffect: false,
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
        hokyuyoinState: null,
        effectQueue: [],
        bonmawashiState: null,
        linkSummonState: null,
        xyzSummonState: null,
        meteorKikougunState: null,
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
                state.bonmawashiState = null;
                state.linkSummonState = null;
                state.xyzSummonState = null;
                state.meteorKikougunState = null;
                state.hasActivatedFafnirSummonEffect = false;
                state.hasActivatedDreitronNova = false;
                state.hasActivatedDivinerSummonEffect = false;
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
                    state.hasActivatedDivinerSummonEffect = false;
                    state.hasActivatedDreitronNova = false;
                    state.hasActivatedEruGanma = false;
                    state.hasActivatedAruZeta = false;

                    // ターン終了時の効果をリセット（レベルバフなど）
                    [...state.field.monsterZones, ...state.field.extraMonsterZones]
                        .filter((monster): monster is CardInstance => monster !== null)
                        .forEach((monster) => {
                            if (monster.buf) {
                                monster.buf.level = 0; // レベルバフをリセット
                            }
                        });
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

        playCard: (cardId: string, zone?: number) => {
            const card = get().hand.find((c) => c.id === cardId);
            if (!card) {
                return;
            }

            set((state) => {
                if (isMonsterCard(card.card)) {
                    // モンスターの場合は召喚選択モードに移行
                    if (!canNormalSummon(state, card)) return;
                    state.effectQueue.unshift({
                        id: "",
                        type: "summon",
                        cardInstance: card,
                        effectType: "normal_summon",
                        canSelectPosition: true,
                        optionPosition: ["attack", "facedown_defense"],
                    });
                    return;
                } else if (isSpellCard(card.card)) {
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

                state.effectQueue.unshift({
                    type: "activate_spell",
                    cardInstance: card,
                    effectType: "",
                    id: "",
                });
            });
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

        selectHokyuyoinTargets: (selectedCards: CardInstance[]) => {
            set((state) => {
                // 選択されたカードを墓地から手札に移動
                selectedCards.forEach((card) => {
                    state.graveyard = state.graveyard.filter((c) => c.id !== card.id);
                    const updatedCard = { ...card, location: "hand" as const };
                    state.hand.push(updatedCard);
                });

                // サーチ効果を終了
                state.hokyuyoinState = null;
            });
        },

        activateDreitrons: (dreitronCard: CardInstance) => {
            // このターンに既に発動済みの場合は発動不可
            const currentState = get();
            if (currentState.hasActivatedBanAlpha && dreitronCard.card.card_name === "竜輝巧－バンα") {
                return;
            }
            if (currentState.hasActivatedAruZeta && dreitronCard.card.card_name === "竜輝巧－アルζ") {
                return;
            }
            if (currentState.hasActivatedEruGanma && dreitronCard.card.card_name === "竜輝巧－エルγ") {
                return;
            }

            set((state) => {
                state.effectQueue.unshift({
                    id: "",
                    type: "select",
                    effectName: `${dreitronCard.card.card_name}（リリース対象選択）`,
                    cardInstance: dreitronCard,
                    getAvailableCards: (state: GameStore) => {
                        return [...state.hand, ...state.field.monsterZones].filter((c) => {
                            if (!c || !isMonsterCard(c.card)) return false;
                            if (!isMonsterCard(c.card)) return false;
                            const isDrytron =
                                (c.card.card_name.includes("竜輝巧") || c.card.card_name.includes("ドライトロン")) &&
                                c.card.card_name !== dreitronCard.card.card_name;
                            const isRitual = c.card.card_type === "儀式・効果モンスター";
                            return isDrytron || isRitual;
                        }) as CardInstance[];
                    },
                    condition: (cards: CardInstance[]) => {
                        return cards.length === 1; // リリース対象が1枚選択された場合のみ有効
                    },
                    effectType: "dreitron_release_select",
                    canCancel: true,
                });
            });
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
                            return getLevel(c) === rank;
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
                        case "dreitron_release_select": {
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－バンα") {
                                state.hasActivatedBanAlpha = true;
                            }
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－エルγ") {
                                state.hasActivatedEruGanma = true;
                            }
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－アルζ") {
                                state.hasActivatedAruZeta = true;
                            }

                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0], "release");

                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                optionPosition: ["defense" as const],
                                canSelectPosition: false,
                            });
                            // バンαの効果を適用
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－バンα") {
                                state.effectQueue.push({
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
                            }
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－エルγ") {
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
                                    state.effectQueue.push({
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
                            }
                            if (currentEffect.cardInstance.card.card_name === "竜輝巧－アルζ") {
                                const target = state.deck.filter((c) => {
                                    return c.card.card_type === "儀式魔法";
                                });
                                if (target.length > 0) {
                                    state.effectQueue.push({
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
                            }

                            break;
                        }

                        case "send_to_graveyard":
                            helper.sendMonsterToGraveyardInternalAnywhere(state, selectedCard[0]);
                            break;
                        case "get_hand_single":
                            helper.toHandFromAnywhere(state, selectedCard[0]);
                            break;
                        case "special_summon":
                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: selectedCard[0],
                                effectType: "",
                                optionPosition: ["attack" as const, "defense" as const],
                                canSelectPosition: true,
                            });
                            break;

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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });
                            break;
                        }
                        case "ritual_summon":
                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                optionPosition: ["attack", "defense"],
                                canSelectPosition: true,
                            });
                            selectedCard.forEach((e) =>
                                helper.sendMonsterToGraveyardInternalAnywhere(state, e, "release")
                            );
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
                        case "diviner_summon_effect": {
                            // 宣告者の神巫の召喚効果: 選択した天使族モンスターを墓地へ送り、そのレベル分だけ宣告者の神巫のレベルを上げる
                            const selectedAngel = selectedCard[0];
                            if (selectedAngel && isMonsterCard(selectedAngel.card)) {
                                const angelLevel = (selectedAngel.card as { level?: number })?.level || 0;

                                // 選択したモンスターを墓地へ送る
                                helper.sendMonsterToGraveyardInternalAnywhere(state, selectedAngel);

                                // 宣告者の神巫のレベルを上げる（ターン終了時まで）
                                const divinerOnField = [
                                    ...state.field.monsterZones,
                                    ...state.field.extraMonsterZones,
                                ].find(
                                    (monster) =>
                                        monster &&
                                        monster.card.card_name === "宣告者の神巫" &&
                                        monster.id === currentEffect.cardInstance.id
                                );

                                if (divinerOnField) {
                                    // バフ情報を追加（既存のバフシステムを使用）
                                    if (!divinerOnField.buf) {
                                        divinerOnField.buf = { level: 0, attack: 0, defense: 0 };
                                    }
                                    divinerOnField.buf.level = (divinerOnField.buf.level || 0) + angelLevel;
                                }

                                // 1ターンに1度の制限フラグを立てる
                                state.hasActivatedDivinerSummonEffect = true;
                            }
                            break;
                        }
                        case "meteor_kikougun_select_ritual_monster": {
                            // 流星輝巧群: 選択された儀式モンスターに対して機械族モンスターを選択
                            const selectedRitualMonster = selectedCard[0];
                            if (selectedRitualMonster && isMonsterCard(selectedRitualMonster.card)) {
                                const requiredAttack = (selectedRitualMonster.card as { attack?: number })?.attack || 0;

                                // 手札・フィールドの機械族モンスターを素材として選択
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "multiselect",
                                    effectName: `流星輝巧群（機械族モンスター選択 - 必要攻撃力: ${requiredAttack}）`,
                                    cardInstance: currentEffect.cardInstance,
                                    getAvailableCards: (state: GameStore) => {
                                        const handMachineMonsters = state.hand.filter((c) => {
                                            if (!isMonsterCard(c.card)) return false;
                                            const monster = c.card as { race?: string };
                                            return monster.race === "機械族";
                                        });
                                        const fieldMachineMonsters = [
                                            ...state.field.monsterZones,
                                            ...state.field.extraMonsterZones,
                                        ].filter((c): c is CardInstance => {
                                            if (!c || !isMonsterCard(c.card)) return false;
                                            const monster = c.card as { race?: string };
                                            return monster.race === "機械族";
                                        });
                                        const myu =
                                            [...state.field.monsterZones, ...state.field.extraMonsterZones]
                                                .find((e) => e?.card.card_name === "竜輝巧－ファフμβ'")
                                                ?.materials.filter(
                                                    (e) => (e.card as { race?: string })?.race === "機械族"
                                                ) ?? [];
                                        return [...handMachineMonsters, ...fieldMachineMonsters, ...myu];
                                    },
                                    condition: (cards: CardInstance[]) => {
                                        // 選択されたモンスターの攻撃力合計が必要攻撃力以上であることを確認
                                        const totalAttack = cards.reduce((sum, c) => {
                                            return sum + getAttack(c);
                                        }, 0);
                                        return cards.length >= 1 && totalAttack >= requiredAttack;
                                    },
                                    effectType: "meteor_kikougun_select_materials",
                                    canCancel: false,
                                });

                                // 選択された儀式モンスターの情報を保存
                                state.meteorKikougunState = {
                                    phase: "select_materials",
                                    selectedRitualMonster: selectedRitualMonster,
                                    requiredAttack: requiredAttack,
                                };
                            }
                            break;
                        }
                        case "meteor_kikougun_select_materials": {
                            // 流星輝巧群: 機械族モンスターをリリースして儀式召喚
                            const selectedMaterials = selectedCard;
                            const ritualMonster = state.meteorKikougunState?.selectedRitualMonster;

                            if (ritualMonster && selectedMaterials.length > 0) {
                                // 選択された素材をリリース（墓地へ送る）
                                selectedMaterials.forEach((material) => {
                                    helper.sendMonsterToGraveyardInternalAnywhere(state, material, "release");
                                });

                                // 儀式モンスターに素材情報を追加
                                const ritualInstanceWithMaterials = {
                                    ...ritualMonster,
                                    materials: selectedMaterials,
                                };

                                // 儀式召喚
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "summon",
                                    cardInstance: ritualInstanceWithMaterials,
                                    effectType: "ritual_summon",
                                    optionPosition: ["attack", "defense"],
                                    canSelectPosition: true,
                                });

                                // 状態をリセット
                                state.meteorKikougunState = null;

                                console.log("Meteor Kikougun ritual summon initiated");
                            }
                            break;
                        }
                        case "special_summon_from_deck_with_destruction": {
                            // デッキから選択したモンスターを特殊召喚（エンドフェイズに破壊）
                            const selectedMonster = selectedCard[0];
                            if (selectedMonster) {
                                // helperを使って特殊召喚
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "summon",
                                    cardInstance: selectedMonster,
                                    effectType: "",
                                    optionPosition: ["attack", "defense"],
                                    canSelectPosition: true,
                                });
                                // エンドフェイズに破壊されるフラグを設定
                                // TODO: エンドフェイズ破壊の実装が必要
                                // 現在の実装では、summonMonsterFromAnywhereの後にフラグを設定する方法がないため、
                                // 別途エンドフェイズ処理の実装が必要
                            }
                            break;
                        }
                        case "advanced_ritual_first_select": {
                            const targetLevel = getLevel(selectedCard[0]);
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
                                    const sumLevel = cards.reduce((prev, cur) => (getLevel(cur) ?? 0) + prev, 0);

                                    return sumLevel === targetLevel;
                                },
                                effectType: "ritual_summon",
                                canCancel: false,
                            });
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });
                            break;
                        }
                        case "fafnir_mu_beta_graveyard": {
                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: selectedCard[0],
                                effectType: "",
                                optionPosition: ["attack", "defense"],
                                canSelectPosition: true,
                            });
                            break;
                        }
                        case "xyz_summon_select_materials": {
                            const xyzMonster = currentEffect.cardInstance;
                            selectedCard.forEach((material) => {
                                helper.monsterExcludeFromField(state, material);
                            });
                            const materials = selectedCard
                                .map((e) => [e, ...e.materials])
                                .flat()
                                .map((e) => ({ ...e, location: "material" as const }));
                            xyzMonster.materials = materials;
                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: xyzMonster,
                                effectType: "",
                                optionPosition: ["attack", "defense"],
                                canSelectPosition: true,
                            });
                            break;
                        }

                        case "link_summon_select_materials": {
                            selectedCard.forEach((e) => helper.sendMonsterToGraveyardInternalAnywhere(state, e));
                            state.effectQueue.unshift({
                                id: "",
                                type: "summon",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "summon",
                                canSelectPosition: false,
                                optionPosition: ["attack"],
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }
                        case "bonmawashi_select_two": {
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "盆回し（自分のフィールドにセットするフィールド魔法を選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: () => selectedCard,
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "bonmawashi_select_one",
                                canCancel: false,
                            });
                            state.bonmawashiState = {
                                selectedCards: selectedCard,
                                phase: "select_two",
                            };
                            break;
                        }
                        case "bonmawashi_select_one": {
                            const opponent = state.bonmawashiState!.selectedCards!.find(
                                (e) => e.id !== selectedCard[0].id
                            )!;
                            state.deck = state.deck.filter((e) => ![opponent.id, selectedCard[0].id].includes(e.id));

                            state.opponentField.fieldZone = opponent;
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });
                            if (state.field.fieldZone !== null) {
                                helper.sendMonsterToGraveyardInternalAnywhere(state, state.field.fieldZone!);
                            }
                            state.field.fieldZone = selectedCard[0];

                            state.effectQueue.push({
                                type: "activate_spell",
                                cardInstance: selectedCard[0],
                                effectType: "",
                                id: "",
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }
                        case "fafnir_summon_effect_option": {
                            if (payload.option[0].value === "use") {
                                state.hasActivatedFafnirSummonEffect = true;
                                const newInstance = { ...currentEffect.cardInstance };
                                newInstance.buf.level -= Math.floor(getAttack(newInstance) / 1000);
                                helper.updateFieldMonster(state, newInstance);
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

                    // 通常召喚の場合はフラグを設定
                    if (currentEffect.effectType === "normal_summon") {
                        state.hasNormalSummoned = true;
                    }

                    helper.summonMonsterFromAnywhere(state, currentEffect.cardInstance, payload.zone, payload.position);
                });
            } else if (payload.type === "activate_spell") {
                set((state) => {
                    if (state.effectQueue.length === 0) return;
                    const currentEffect = state.effectQueue[0];
                    state.effectQueue.shift(); // Remove the processed effect
                    switch (currentEffect.cardInstance.card.card_name) {
                        case "金満で謙虚な壺": {
                            state.hasActivatedExtravagance = true; // 金満で謙虚な壺を発動したフラグを立てる
                            state.effectQueue.unshift({
                                id: "",
                                type: "option",
                                effectName: "金満で謙虚な壺（エクストラデッキの除外枚数選択）",
                                cardInstance: currentEffect.cardInstance,
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
                                cardInstance: currentEffect.cardInstance,
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
                                cardInstance: currentEffect.cardInstance,
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }

                        case "ジャック・イン・ザ・ハンド": {
                            state.hasActivatedJackInTheHand = true;
                            state.effectQueue.unshift({
                                id: "",
                                type: "multiselect",
                                effectName: "ジャック・イン・ザ・ハンド（3体選択）",
                                cardInstance: currentEffect.cardInstance,
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
                                cardInstance: currentEffect.cardInstance,
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }

                        case "極超の竜輝巧": {
                            state.hasActivatedDreitronNova = true;
                            // デッキから「ドライトロン」モンスター1体を特殊召喚
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "極超の竜輝巧（ドライトロン選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.filter((c): c is CardInstance => {
                                        if (!isMonsterCard(c.card)) return false;
                                        return (
                                            c.card.card_name.includes("竜輝巧") ||
                                            c.card.card_name.includes("ドライトロン")
                                        );
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "special_summon_from_deck_with_destruction",
                                canCancel: false,
                            });
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }

                        case "テラ・フォーミング": {
                            // デッキからフィールド魔法カード1枚を手札に加える
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "テラ・フォーミング（フィールド魔法選択）",
                                cardInstance: currentEffect.cardInstance,
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });

                            break;
                        }

                        case "盆回し": {
                            // デッキから異なるフィールド魔法を取得
                            state.effectQueue.unshift({
                                id: "",
                                type: "multiselect",
                                effectName: "盆回し（フィールド魔法を2つ選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    return state.deck.filter((c): c is CardInstance => {
                                        return c.card.card_type === "フィールド魔法";
                                    });
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 2;
                                },
                                effectType: "bonmawashi_select_two",
                                canCancel: false,
                            });
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
                                cardInstance: currentEffect.cardInstance,
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
                            break;
                        }

                        case "儀式の準備": {
                            if (state.graveyard.some((c) => c.card.card_type === "儀式魔法")) {
                                state.effectQueue.unshift({
                                    id: "",
                                    type: "select",
                                    effectName: "儀式の準備（儀式魔法選択）",
                                    cardInstance: currentEffect.cardInstance,
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
                                cardInstance: currentEffect.cardInstance,
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
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });
                            break;
                        }

                        case "高等儀式術": {
                            // 手札から儀式モンスターを選択させる
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "高等儀式術（儀式モンスター選択）",
                                cardInstance: currentEffect.cardInstance,
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
                            state.effectQueue.unshift({
                                id: "",
                                type: "select",
                                effectName: "流星輝巧群（儀式モンスター選択）",
                                cardInstance: currentEffect.cardInstance,
                                getAvailableCards: (state: GameStore) => {
                                    const handRitualMonsters = state.hand.filter(
                                        (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                                    );
                                    const graveyardRitualMonsters = state.graveyard.filter(
                                        (c) => isMonsterCard(c.card) && c.card.card_type === "儀式・効果モンスター"
                                    );
                                    return [...handRitualMonsters, ...graveyardRitualMonsters];
                                },
                                condition: (cards: CardInstance[]) => {
                                    return cards.length === 1;
                                },
                                effectType: "meteor_kikougun_select_ritual_monster",
                                canCancel: false,
                            });
                            state.effectQueue.push({
                                type: "spell_end",
                                cardInstance: currentEffect.cardInstance,
                                effectType: "",
                                id: "",
                            });
                            break;
                        }
                    }
                });
            }
        },

        clearQueue: () => {
            set((state) => {
                state.effectQueue = [];
            });
        },
        popQueue: () => {
            set((state) => {
                state.effectQueue.shift();
            });
        },

        sendSpellToGraveyard: (card: CardInstance) => {
            set((state) => {
                helper.sendMonsterToGraveyardInternalAnywhere(state, card);
            });
        },


    }))
);
