import type { DisplayField } from "@/const/card";
import type { CardInstance } from "./card";
import type { Position } from "@/utils/effectUtils";
import type { Deck } from "@/data/deckUtils";
import type { DeckEffect } from "@/components/DeckEffectSelectorModal";

export type GamePhase = "draw" | "standby" | "main1" | "battle" | "main2" | "end";

export interface GameState {
    turn: number;
    phase: GamePhase;
    lifePoints: number;
    opponentLifePoints: number;
    deck: CardInstance[];
    hand: CardInstance[];
    field: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
        extraMonsterZones: (CardInstance | null)[];
    };
    opponentField: {
        monsterZones: (CardInstance | null)[];
        spellTrapZones: (CardInstance | null)[];
        fieldZone: CardInstance | null;
    };
    graveyard: CardInstance[];
    banished: CardInstance[];
    extraDeck: CardInstance[];
    hasNormalSummoned: boolean;
    normalSummonProhibited: boolean;
    hasSpecialSummoned: boolean;
    hasDrawnByEffect: boolean;
    isLinkSummonProhibited: boolean;
    isFieldSpellActivationProhibited: boolean;
    isFieldSpellActivationAllowed: string | null;
    isOpponentTurn: boolean;
    gameOver: boolean;
    winner: "player" | "timeout" | null;
    winReason?: "exodia" | "life_points" | "deck_out" | "horakty" | null;
    turnRestrictions?: {
        cannotActivateEffects?: string[];
    };
    currentFrom: { location: DisplayField; index?: number; length?: number; position?: Position };
    currentTo: { location: DisplayField; index?: number; length?: number; position?: Position };
    throne: [CardInstance | null, CardInstance | null, CardInstance | null, CardInstance | null, CardInstance | null];
    isProcessing: boolean;
    originDeck: Deck | null;
    cardChain: CardInstance[];
    deckEffects: DeckEffect[];
    monstersToGraveyardThisTurn: CardInstance[];
}
