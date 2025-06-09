import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState } from "@/types/game";
import { DECK } from "@/class/card/deck";
import { createCardInstance } from "@/class/cards";
import type { CardInstance } from "@/types/card";

type ProcessQueuePayload =
    | { type: "cardSelect"; cardList: CardInstance[] }
    | { type: "option"; option: { name: string; value: string }[] }
    | { type: "summon"; zone: number; position: "attack" | "defense" | "facedown" | "facedown_defense" }
    | { type: "confirm"; confirmed: boolean };

// Callback result types
type CallbackResult = unknown;

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
          condition: (selectedCards: CardInstance[], state: GameStore) => boolean;
          canCancel: boolean;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
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
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "summon";
          cardInstance: CardInstance;
          effectType: string;
          canSelectPosition: boolean;
          optionPosition: ("attack" | "defense" | "facedown" | "facedown_defense")[];
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "activate_spell";
          cardInstance: CardInstance;
          effectType: string;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "spell_end";
          cardInstance: CardInstance;
          effectType: string;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "notify";
          cardInstance: CardInstance;
          effectType: string;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "link_summon";
          cardInstance: CardInstance;
          effectType: string;
          targetMonster: CardInstance;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "xyz_summon";
          cardInstance: CardInstance;
          effectType: string;
          targetMonster: CardInstance;
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "material_select";
          cardInstance: CardInstance;
          effectType: string;
          targetMonster: CardInstance;
          availableMaterials: CardInstance[];
          requiredCount: number;
          summonType: "link" | "xyz";
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      }
    | {
          id: string;
          type: "perform_summon";
          cardInstance: CardInstance;
          effectType: string;
          targetMonster: CardInstance;
          selectedMaterials: CardInstance[];
          summonType: "link" | "xyz";
          callback?: (state: GameStore, card: CardInstance, result: CallbackResult) => void;
      };

export interface GameStore extends GameState {
    turnOnceUsedEffectMemo: Record<string, boolean>;
    initializeGame: () => void;
    effectQueue: EffectQueueItem[];
    addEffectToQueue: (effect: EffectQueueItem) => void;
    processQueueTop: (payload: ProcessQueuePayload) => void;
    clearQueue: () => void;
    popQueue: () => void;

    // Game actions
    selectedCard: string | null;
    nextPhase: () => void;
    playCard: (cardId: string) => void;
    setCard: (cardId: string | null) => void;
    startLinkSummon: (linkMonster: CardInstance) => void;
    startXyzSummon: (xyzMonster: CardInstance) => void;
    sendSpellToGraveyard: (cardInstance: CardInstance) => void;
    checkExodiaWin: () => void;
    endGame: () => void;
    judgeWin: () => void;
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
    isLinkSummonProhibited: false,
    isOpponentTurn: false,
    gameOver: false,
    winner: null,
    hasDrawnByEffect: false,
};

export const useGameStore = create<GameStore>()(
    immer((set) => ({
        ...initialState,
        turnOnceUsedEffectMemo: {},
        hokyuyoinState: null,
        effectQueue: [],
        bonmawashiState: null,
        linkSummonState: null,
        xyzSummonState: null,
        meteorKikougunState: null,
        initializeGame: () => {
            const deckData = DECK;

            const mainDeckInstances = deckData.main_deck.map((card) => createCardInstance(card, "Deck"));

            const extraDeckInstances = deckData.extra_deck.map((card) => createCardInstance(card, "ExtraDeck"));

            set((state) => {
                // Initialize deck and shuffle
                state.deck = mainDeckInstances.sort(() => Math.random() - 0.5);
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
                state.gameOver = false;
                state.winner = null;

                // Clear effect queue
                state.effectQueue = [];

                // Reset all turn-based flags
                state.turnOnceUsedEffectMemo = {};
            });

            // Draw opening hand
            set((state) => {
                for (let i = 0; i < 5; i++) {
                    if (state.deck.length > 0) {
                        const drawnCard = state.deck.shift()!;
                        drawnCard.location = "Hand";
                        state.hand.push(drawnCard);
                    }
                }
            });
        },

        // Effect Queue System
        addEffectToQueue: (effect: EffectQueueItem) => {
            set((state) => {
                state.effectQueue.push(effect);
            });
        },

        processQueueTop: (payload: ProcessQueuePayload) => {
            set((state) => {
                if (state.effectQueue.length === 0) return;
                const currentEffect = state.effectQueue[0];
                state.effectQueue.shift();

                // Handle effects directly through payload without pendingCallbacks
                switch (payload.type) {
                    case "confirm": {
                        if (currentEffect.effectType === "with_user_confirm_callback" && currentEffect.callback) {
                            if (payload.confirmed) {
                                currentEffect.callback(state, currentEffect.cardInstance, payload.confirmed);
                            }
                        }
                        break;
                    }
                    case "cardSelect": {
                        if (currentEffect.effectType === "with_user_select_card_callback" && currentEffect.callback) {
                            currentEffect.callback(state, currentEffect.cardInstance, payload.cardList);
                        }
                        break;
                    }
                    case "option": {
                        if (currentEffect.effectType === "with_option_callback" && currentEffect.callback) {
                            currentEffect.callback(state, currentEffect.cardInstance, payload.option[0].value);
                        }
                        break;
                    }
                    case "summon": {
                        if (currentEffect.effectType === "with_user_summon_callback" && currentEffect.callback) {
                            currentEffect.callback(state, currentEffect.cardInstance, {
                                zone: payload.zone,
                                position: payload.position,
                            });
                        }
                        break;
                    }
                    default:
                        console.warn("Unknown payload type:", payload);
                        break;
                }
            });
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

        // Game actions implementation
        selectedCard: null,

        nextPhase: () => {
            set((state) => {
                // Basic phase progression
                switch (state.phase) {
                    case "main1":
                        state.phase = "end";
                        break;
                    case "end":
                        state.phase = "main1";
                        state.turn += 1;
                        // Reset turn-based flags
                        state.hasNormalSummoned = false;
                        state.hasSpecialSummoned = false;
                        state.hasDrawnByEffect = false;
                        // Reset turn-once effect memo
                        if (state.turnOnceUsedEffectMemo) {
                            state.turnOnceUsedEffectMemo = {};
                        }
                        break;
                    default:
                        state.phase = "main1";
                }
            });
        },

        playCard: (cardId: string) => {
            set((state) => {
                const cardInstance = state.hand.find((c) => c.id === cardId);
                if (!cardInstance) return;

                // Remove card from hand
                state.hand = state.hand.filter((c) => c.id !== cardId);

                const card = cardInstance.card;

                // Pure card type classification - UI has already checked conditions
                if (card.card_type === "魔法") {
                    // Handle spell cards
                    const magicCard = card as import("@/class/cards").MagicCard;
                    const spellSubtype = magicCard.magic_type;

                    if (spellSubtype === "通常魔法" || spellSubtype === "速攻魔法" || spellSubtype === "儀式魔法") {
                        // Spells that go to graveyard after use
                        // 1. Queue spell_end job at the end
                        state.effectQueue.push({
                            id: cardInstance.id + "_spell_end",
                            type: "spell_end",
                            cardInstance: cardInstance,
                            effectType: "send_to_graveyard",
                        });

                        // 2. Queue activation at the front (processed first)
                        state.effectQueue.unshift({
                            id: cardInstance.id + "_activation",
                            type: "activate_spell",
                            cardInstance: cardInstance,
                            effectType: "spell_activation",
                        });

                        // Temporarily place on field
                        cardInstance.location = "SpellField";
                    } else if (spellSubtype === "永続魔法" || spellSubtype === "装備魔法") {
                        // Continuous/Equipment spells stay on field
                        cardInstance.location = "SpellField";

                        // Find empty spell/trap zone
                        const emptyIndex = state.field.spellTrapZones.findIndex((zone) => zone === null);
                        if (emptyIndex !== -1) {
                            state.field.spellTrapZones[emptyIndex] = cardInstance;
                        }
                    } else if (spellSubtype === "フィールド魔法") {
                        // Field spells go to field zone
                        cardInstance.location = "SpellField";

                        if (state.field.fieldZone) {
                            // Send existing field spell to graveyard
                            state.field.fieldZone.location = "Graveyard";
                            state.graveyard.push(state.field.fieldZone);
                        }
                        state.field.fieldZone = cardInstance;
                    }
                } else if (card.card_type === "罠") {
                    // Handle trap cards - always set face-down
                    cardInstance.location = "SpellField";
                    cardInstance.position = "back"; // face-down

                    // Find empty spell/trap zone
                    const emptyIndex = state.field.spellTrapZones.findIndex((zone) => zone === null);
                    if (emptyIndex !== -1) {
                        state.field.spellTrapZones[emptyIndex] = cardInstance;
                    }
                } else if (card.card_type === "モンスター") {
                    // Handle monster cards - summon to field
                    cardInstance.location = "MonsterField";
                    cardInstance.position = "attack"; // default attack position

                    // Find empty monster zone
                    const emptyIndex = state.field.monsterZones.findIndex((zone) => zone === null);
                    if (emptyIndex !== -1) {
                        state.field.monsterZones[emptyIndex] = cardInstance;
                        state.hasNormalSummoned = true;
                    }
                }
            });
        },

        setCard: (cardId: string | null) => {
            set((state) => {
                (state as GameStore & { selectedCard: string | null }).selectedCard = cardId;
            });
        },

        // Removed individual card effect implementations - cards handle their own effects

        startLinkSummon: (linkMonster: CardInstance) => {
            set((state) => {
                // Get available materials for link summon
                const availableMaterials = [
                    ...state.field.monsterZones.filter((zone) => zone !== null),
                    ...state.field.extraMonsterZones.filter((zone) => zone !== null),
                ] as CardInstance[];

                const linkCard = linkMonster.card as import("@/class/cards").LinkMonsterCard;
                const linkRating = linkCard.link || 1;

                // Add material selection job to queue
                state.effectQueue.push({
                    id: linkMonster.id + "_material_select",
                    type: "material_select",
                    cardInstance: linkMonster,
                    effectType: "link_material_selection",
                    targetMonster: linkMonster,
                    availableMaterials: availableMaterials,
                    requiredCount: linkRating,
                    summonType: "link",
                });
            });
        },

        startXyzSummon: (xyzMonster: CardInstance) => {
            set((state) => {
                // Get available materials for xyz summon
                const xyzCard = xyzMonster.card as import("@/class/cards").XyzMonsterCard;
                const xyzRank = xyzCard.rank || 1;
                const availableMaterials = [
                    ...state.field.monsterZones.filter((zone) => zone !== null),
                    ...state.field.extraMonsterZones.filter((zone) => zone !== null),
                ].filter((monster) => {
                    if (!monster) return false;
                    const levelCard = monster.card as import("@/class/cards").LeveledMonsterCard;
                    return levelCard.level === xyzRank;
                }) as CardInstance[];

                // Add material selection job to queue
                state.effectQueue.push({
                    id: xyzMonster.id + "_material_select",
                    type: "material_select",
                    cardInstance: xyzMonster,
                    effectType: "xyz_material_selection",
                    targetMonster: xyzMonster,
                    availableMaterials: availableMaterials,
                    requiredCount: 2, // Most xyz monsters require 2 materials
                    summonType: "xyz",
                });
            });
        },

        sendSpellToGraveyard: (cardInstance: CardInstance) => {
            set((state) => {
                cardInstance.location = "Graveyard";
                state.graveyard.push(cardInstance);
            });
        },

        // Card effect implementations are handled by the cards themselves via the effect system

        checkExodiaWin: () => {
            set((state) => {
                const exodiaPieces = [
                    "封印されしエクゾディア",
                    "封印されし者の右腕",
                    "封印されし者の左腕",
                    "封印されし者の右足",
                    "封印されし者の左足",
                ];

                const hasAllPieces = exodiaPieces.every((pieceName) =>
                    state.hand.some((card) => card.card.card_name === pieceName)
                );

                if (hasAllPieces) {
                    state.gameOver = true;
                    state.winner = "player";
                }
            });
        },

        endGame: () => {
            set((state) => {
                state.gameOver = true;
                state.winner = "timeout";
            });
        },

        judgeWin: () => {
            set((state) => {
                // Basic win condition checks
                if (state.lifePoints <= 0) {
                    state.gameOver = true;
                    state.winner = "timeout";
                }
            });
        },
    }))
);
