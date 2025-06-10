import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState } from "@/types/game";
import { DECK } from "@/data/cards";
import { createCardInstance } from "@/utils/cardManagement";
import { excludeFromAnywhere, sendCard, summon } from "@/utils/cardMovement";
import type { CardInstance, MagicCard } from "@/types/card";
import { withUserSummon, type Position } from "@/utils/effectUtils";
import { pushQueue } from "../utils/effectUtils";

export type ProcessQueuePayload =
    | { type: "cardSelect"; cardList: CardInstance[] }
    | { type: "option"; option: { name: string; value: string }[] }
    | { type: "summon"; zone: number; position: "back_defense" | "attack" | "back" | "defense" }
    | { type: "confirm"; confirmed: boolean };

// Callback result types for documentation
// These are the specific types passed to callbacks:
// - Card selection callbacks: CardInstance[]
// - Option selection callbacks: string
// - Summon callbacks: { zone: number; position: Position }
// - Confirm callbacks: boolean

export type EffectQueueItem =
    | (
          | {
                id: string;
                type: "search" | "select" | "multiselect";
                effectName: string;
                cardInstance: CardInstance;
                maxSelections?: number;
                effectType: string;
                filterFunction?: (card: CardInstance, alreadySelected: CardInstance[]) => boolean;
                getAvailableCards: (state: GameStore) => CardInstance[];
                condition: (selectedCards: CardInstance[], state: GameStore) => boolean;
                canCancel: boolean;
                callback?: (state: GameStore, cardInstance: CardInstance, selectedCards: CardInstance[]) => void;
            }
          | {
                id: string;
                type: "confirm";
                effectName: string;
                cardInstance: CardInstance;
                effectType: string;
                condition: () => boolean;
                canCancel: boolean;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
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
                callback?: (state: GameStore, cardInstance: CardInstance, selectedOption: string) => void;
            }
          | {
                id: string;
                type: "summon";
                cardInstance: CardInstance;
                effectType: string;
                canSelectPosition: boolean;
                optionPosition: Exclude<Position, undefined>[];
                callback?: (
                    state: GameStore,
                    cardInstance: CardInstance,
                    result: { zone: number; position: "back_defense" | "attack" | "back" | "defense" | undefined }
                ) => void;
            }
          | {
                id: string;
                type: "activate_spell";
                cardInstance: CardInstance;
                effectType: string;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
            }
          | {
                id: string;
                type: "spell_end";
                cardInstance: CardInstance;
                effectType: string;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
            }
          | {
                id: string;
                type: "notify";
                cardInstance: CardInstance;
                effectType: string;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
            }
          | {
                id: string;
                type: "material_select";
                cardInstance: CardInstance;
                effectType: string;
                targetMonster: CardInstance;
                summonType: "link" | "xyz";
                getAvailableCards: (state: GameStore) => CardInstance[];
                callback: (state: GameStore, cardInstance: CardInstance, selectedMaterials: CardInstance[]) => void;
            }
      ) & { order: number };

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
    playCard: (card: CardInstance) => void;
    setCard: (card: CardInstance) => void;
    startLinkSummon: (linkMonster: CardInstance) => void;
    startXyzSummon: (xyzMonster: CardInstance) => void;
    sendSpellToGraveyard: (cardInstance: CardInstance) => void;
    activateEffect: (card: CardInstance) => void;
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
                for (let i = 0; i < 15; i++) {
                    if (state.deck.length > 0) {
                        const drawnCard = state.deck.shift()!;
                        drawnCard.location = "Hand";
                        state.hand.push(drawnCard);
                    }
                }
            });
        },

        activateEffect: (card: CardInstance) => {
            set((state) => {
                card.card.effect.onIgnition?.effect(state, card);
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
                console.log("ajaiaijfeji");
                if (state.effectQueue.length === 0) return;
                const currentEffect = state.effectQueue[0];
                console.log(state.effectQueue);

                state.effectQueue.shift();

                // Handle effects directly through payload without pendingCallbacks

                switch (payload.type) {
                    case "confirm": {
                        if (currentEffect.callback && currentEffect.type === "confirm") {
                            if (payload.confirmed) {
                                currentEffect.callback(state, currentEffect.cardInstance);
                            }
                        }
                        break;
                    }
                    case "cardSelect": {
                        if (
                            (currentEffect.type === "search" ||
                                currentEffect.type === "select" ||
                                currentEffect.type === "multiselect" ||
                                currentEffect.type === "material_select") &&
                            currentEffect.callback
                        ) {
                            currentEffect.callback(state, currentEffect.cardInstance, payload.cardList);
                        }
                        break;
                    }
                    case "option": {
                        if (currentEffect.type === "option" && currentEffect.callback) {
                            currentEffect.callback(state, currentEffect.cardInstance, payload.option[0].value);
                        }
                        break;
                    }
                    case "summon": {
                        if (currentEffect.type === "summon" && currentEffect.callback) {
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

        playCard: (card: CardInstance) => {
            set((state) => {
                // Pure card type classification - UI has already checked conditions
                if (card.card.card_type === "魔法") {
                    // Handle spell cards
                    const magicCard = card.card as MagicCard;
                    const spellSubtype = magicCard.magic_type;

                    if (spellSubtype === "通常魔法" || spellSubtype === "速攻魔法" || spellSubtype === "儀式魔法") {
                        // Spells that go to graveyard after use
                        // 1. Queue spell_end job at the end
                        pushQueue(state, {
                            order: 0,
                            id: card.id + "_spell_end",
                            type: "spell_end",
                            cardInstance: card,
                            effectType: "send_to_graveyard",
                        });

                        // 2. Queue activation at the front (processed first)
                        pushQueue(state, {
                            order: 0,
                            id: card.id + "_activation",
                            type: "activate_spell",
                            cardInstance: card,
                            effectType: "spell_activation",
                        });
                        sendCard(state, card, "SpellField");
                    } else if (spellSubtype === "永続魔法" || spellSubtype === "装備魔法") {
                        // Continuous/Equipment spells stay on field
                        sendCard(state, card, "SpellField");
                    } else if (spellSubtype === "フィールド魔法") {
                        // Field spells go to field zone
                        sendCard(state, card, "FieldZone");
                    }
                } else if (card.card.card_type === "罠") {
                    sendCard(state, card, "SpellField");
                } else if (card.card.card_type === "モンスター") {
                    // Handle monster cards - add to effect queue for user to choose position and zone
                    pushQueue(state, {
                        order: 0,
                        id: card.id + "_normal_summon",
                        type: "summon",
                        cardInstance: card,
                        effectType: "normal_summon",
                        canSelectPosition: true,
                        optionPosition: ["attack", "back_defense"],
                        callback: (
                            state: GameStore,
                            cardInstance: CardInstance,
                            result: {
                                zone: number;
                                position: "back_defense" | "attack" | "back" | "defense" | undefined;
                            }
                        ) => {
                            summon(state, cardInstance, result.zone, result.position);
                            // Mark that normal summon was used
                            state.hasNormalSummoned = true;
                        },
                    });
                }
            });
        },

        setCard: (card: CardInstance) => {
            set((state) => {
                sendCard(state, card, "SpellField", { reverse: true });
            });
        },

        // Removed individual card effect implementations - cards handle their own effects

        startLinkSummon: (linkMonster: CardInstance) => {
            set((state) => {
                pushQueue(state, {
                    order: 0,

                    id: linkMonster.id + "_material_select",
                    type: "material_select",
                    cardInstance: linkMonster,
                    effectType: "link_material_selection",
                    targetMonster: linkMonster,
                    summonType: "link",
                    getAvailableCards: (state) => {
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                            (e): e is CardInstance => e !== null
                        );
                    },
                    callback: (state, card, selected) => {
                        for (const card of selected) {
                            sendCard(state, card, "Graveyard");
                        }
                        withUserSummon(
                            state,
                            card,
                            card,
                            { canSelectPosition: false, optionPosition: ["attack"] },
                            () => {}
                        );
                    },
                });
            });
        },

        startXyzSummon: (xyzMonster: CardInstance) => {
            set((state) => {
                // Get available materials for xyz summon
                // Add material selection job to queue
                pushQueue(state, {
                    order: 0,
                    id: xyzMonster.id + "_material_select",
                    type: "material_select",
                    cardInstance: xyzMonster,
                    effectType: "xyz_material_selection",
                    targetMonster: xyzMonster,
                    getAvailableCards: (state) => {
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
                            (e): e is CardInstance => !e
                        );
                    },
                    summonType: "xyz",
                    callback: (state, card, selected) => {
                        const newInstance = { ...card, material: [...selected] };
                        for (const card of selected) {
                            excludeFromAnywhere(state, card);
                        }
                        withUserSummon(state, newInstance, newInstance, {}, () => {});
                    },
                });
            });
        },

        sendSpellToGraveyard: (cardInstance: CardInstance) => {
            set((state) => {
                sendCard(state, cardInstance, "Graveyard");
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
