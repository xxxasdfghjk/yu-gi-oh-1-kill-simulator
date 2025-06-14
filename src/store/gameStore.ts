import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState } from "@/types/game";
import type { Deck } from "@/data/deckUtils";
import deckList from "@/data/deck/deckList";

import { createCardInstance, isLinkMonster, isXyzMonster } from "@/utils/cardManagement";
import { excludeFromAnywhere, sendCard } from "@/utils/cardMovement";
import type { CardInstance } from "@/types/card";
import { withDelay, withUserSummon, type Position, playCardInternal } from "@/utils/effectUtils";
import { pushQueue } from "../utils/effectUtils";
import { placementPriority } from "@/components/SummonSelector";

export type ProcessQueuePayload =
    | { type: "cardSelect"; cardList: CardInstance[] }
    | { type: "option"; option: { name: string; value: string }[] }
    | { type: "summon"; zone: number; position: "back_defense" | "attack" | "back" | "defense" }
    | { type: "confirm"; confirmed: boolean }
    | { type: "spellend"; cardInstance: CardInstance; callback?: (state: GameStore, card: CardInstance) => void }
    | { type: "delay" }
    | { type: "chain_select"; selectedCard?: CardInstance };

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
                delay?: number;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
            }
          | {
                id: string;
                type: "notification";
                cardInstance: CardInstance;
                effectType: string;
                message: string;
                duration?: number;
                callback?: (state: GameStore, cardInstance: CardInstance) => void;
            }
          | {
                id: string;
                type: "life_change";
                cardInstance: CardInstance;
                effectType: string;
                target: "player" | "opponent";
                amount: number;
                operation: "decrease" | "increase";
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
          | {
                id: string;
                type: "chain_check";
                cardInstance: CardInstance;
                chain?: CardInstance[];
                effectType: string;
                delay?: number;
                callback?: (state: GameStore, cardInstance: CardInstance, selected?: CardInstance) => void;
            }
      ) & { order: number };

export interface GameStore extends GameState {
    turnOnceUsedEffectMemo: Record<string, boolean>;

    // Deck selection
    selectedDeck: Deck | null;
    availableDecks: Deck[];
    isDeckSelectionOpen: boolean;
    selectDeck: (deck: Deck) => void;
    setDeckSelectionOpen: (open: boolean) => void;

    initializeGame: (deck?: Deck) => void;
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
    draw: () => void;
    resetAnimationState: () => void;
    setGameOver: (winner: "player" | "timeout") => void;
    animationExodiaWin: () => void;
}

const initialState: GameState = {
    turn: 1,
    phase: "main1",
    lifePoints: 8000,
    opponentLifePoints: 8000,
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
    isFieldSpellActivationProhibited: false,
    isOpponentTurn: false,
    gameOver: false,
    winner: null,
    hasDrawnByEffect: false,
    currentFrom: { location: "Deck" },
    currentTo: { location: "Hand" },
    throne: [null, null, null, null, null],
    isProcessing: false,
    originDeck: null,
    cardChain: [],
};

export const useGameStore = create<GameStore>()(
    immer((set) => ({
        ...initialState,
        turnOnceUsedEffectMemo: {},
        effectQueue: [],

        // Deck selection state
        selectedDeck: null,
        availableDecks: deckList.map((deck) => deck.default),
        isDeckSelectionOpen: true,

        selectDeck: (deck: Deck) => {
            set((state) => {
                state.selectedDeck = deck;
                state.isDeckSelectionOpen = false;
            });
        },

        setDeckSelectionOpen: (open: boolean) => {
            set((state) => {
                state.isDeckSelectionOpen = open;
            });
        },

        initializeGame: (deck?: Deck) => {
            const deckData = deck || deckList[0]?.default; // fallback to first deck if none provided
            if (!deckData) return;

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

                // Reset game flags
                state.hasNormalSummoned = false;
                state.hasSpecialSummoned = false;
                state.isLinkSummonProhibited = false;
                state.isFieldSpellActivationProhibited = false;
                state.isOpponentTurn = false;
                state.hasDrawnByEffect = false;

                // Reset animation state
                state.currentFrom = { location: "Deck" };
                state.currentTo = { location: "Hand" };

                // Reset special states
                state.selectedCard = null;

                // Clear effect queue
                state.effectQueue = [];

                // Reset all turn-based flags
                state.turnOnceUsedEffectMemo = {};
                state.throne = [null, null, null, null, null];
                state.isProcessing = false;
                state.originDeck = deckData;
                state.cardChain = [];
            });
        },

        activateEffect: (card: CardInstance) => {
            set((state) => {
                state.isProcessing = true;
                card.card.effect.onIgnition?.effect(state, card);
                state.isProcessing = false;
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
                        state.isProcessing = false;
                        break;
                    }
                    case "spellend": {
                        sendCard(state, currentEffect.cardInstance, "Graveyard");
                        payload?.callback?.(state, payload.cardInstance);
                        state.isProcessing = false;
                        break;
                    }
                    case "delay": {
                        if (
                            currentEffect.type === "notify" ||
                            currentEffect.type === "notification" ||
                            currentEffect.type === "life_change"
                        )
                            currentEffect?.callback?.(state, currentEffect.cardInstance);
                        break;
                    }
                    case "chain_select": {
                        if (currentEffect.type === "chain_check") {
                            if (payload.selectedCard) {
                                currentEffect?.callback?.(state, currentEffect.cardInstance, payload.selectedCard);
                            } else {
                                currentEffect.callback?.(state, currentEffect.cardInstance);
                            }
                        }
                        break;
                    }

                    default:
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
                state.isProcessing = false;
            });
        },
        draw: () => {
            set((state) => {
                sendCard(state, state.deck[0], "Hand");
            });
        },
        // Game actions implementation
        selectedCard: null,

        nextPhase: () => {
            set((state) => {
                // Basic phase progression
                switch (state.phase) {
                    case "main1":
                        state.phase = "draw";
                        state.isOpponentTurn = true;
                        state.turn = state.turn + 1;
                        break;
                    case "draw":
                        state.phase = "main1";
                }
            });
        },

        playCard: (card: CardInstance) => {
            set((state) => {
                playCardInternal(state, card);
            });
        },

        setCard: (card: CardInstance) => {
            set((state) => {
                const newCard = { ...card, setTurn: state.turn };
                const availableSpace = state.field.spellTrapZones
                    .map((e, i) => ({ i, e: e }))
                    .filter(({ e }) => e === null)
                    .map((e) => e.i);
                const index = placementPriority(availableSpace);
                sendCard(state, newCard, "SpellField", { reverse: true, spellFieldIndex: index });
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
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones]
                            .filter(
                                (e): e is CardInstance =>
                                    e !== null && (e.position === "attack" || e.position === "defense")
                            )
                            .filter(
                                (e) => isLinkMonster(linkMonster.card) && linkMonster.card.filterAvailableMaterials(e)
                            );
                    },
                    callback: (state, card, selected) => {
                        for (let i = 0; i < selected.length; i++) {
                            withDelay(state, card, { order: 0, delay: 20 }, (state) => {
                                sendCard(state, selected[i], "Graveyard");
                            });
                        }
                        withUserSummon(
                            state,
                            card,
                            card,
                            { canSelectPosition: false, optionPosition: ["attack"], order: 5 },
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
                        return [...state.field.monsterZones, ...state.field.extraMonsterZones]
                            .filter(
                                (e): e is CardInstance =>
                                    e !== null && (e.position === "attack" || e.position === "defense")
                            )
                            .filter(
                                (e) => isXyzMonster(xyzMonster.card) && xyzMonster.card.filterAvailableMaterials(e)
                            );
                    },
                    summonType: "xyz",
                    callback: (state, card, selected) => {
                        const newMaterials = selected.map((e) => ({ ...e, location: "Material" as const }));
                        const newInstance = { ...card, materials: [...newMaterials] };
                        for (const card of selected) {
                            const from = excludeFromAnywhere(state, card);
                            state.currentFrom = from;
                            state.currentTo = { location: "ExtraDeck" };
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

        checkExodiaWin: (onExodiaWin?: (pieces: CardInstance[]) => void) => {
            set((state) => {
                const exodiaPieceNames = [
                    "封印されしエクゾディア",
                    "封印されし者の右腕",
                    "封印されし者の左腕",
                    "封印されし者の右足",
                    "封印されし者の左足",
                ];

                const exodiaPieces = exodiaPieceNames
                    .map((pieceName) => state.hand.find((card) => card.card.card_name === pieceName))
                    .filter(Boolean) as CardInstance[];

                if (exodiaPieces.length === 5) {
                    if (onExodiaWin) {
                        onExodiaWin(exodiaPieces);
                    } else {
                        state.gameOver = true;
                        state.winner = "player";
                    }
                }
            });
        },

        animationExodiaWin: () => {
            set((state) => {
                const exodiaPieceNames = [
                    "封印されしエクゾディア",
                    "封印されし者の右腕",
                    "封印されし者の左腕",
                    "封印されし者の右足",
                    "封印されし者の左足",
                ];
                const targetList = [...state.hand, ...state.deck];
                let count = 0;
                for (const target of targetList) {
                    if (exodiaPieceNames.includes(target.card.card_name)) {
                        count++;
                        withDelay(state, target, { delay: (count + 1) * 60 }, (state, target) => {
                            sendCard(state, target, "Throne");
                        });
                    }
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

        resetAnimationState: () => {
            set((state) => {
                state.currentFrom = { location: "Deck" };
                state.currentTo = { location: "Hand" };
            });
        },

        setGameOver: (winner: "player" | "timeout") => {
            set((state) => {
                state.gameOver = true;
                state.winner = winner;
            });
        },
    }))
);
