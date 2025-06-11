import type { DisplayField } from "@/const/card";
import type { CardInstance } from "./card";
import type { Position } from "@/utils/effectUtils";

export type GamePhase = "draw" | "standby" | "main1" | "battle" | "main2" | "end";

export interface GameState {
    turn: number;
    phase: GamePhase;
    lifePoints: number;
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
    hasSpecialSummoned: boolean;
    hasDrawnByEffect: boolean;
    isLinkSummonProhibited: boolean;
    isFieldSpellActivationProhibited: boolean;
    isOpponentTurn: boolean;
    gameOver: boolean;
    winner: "player" | "timeout" | null;
    turnRestrictions?: {
        cannotActivateEffects?: string[];
    };
    currentFrom: { location: DisplayField; index?: number; length?: number; position?: Position };
    currentTo: { location: DisplayField; index?: number; length?: number; position?: Position };
}

export interface ChainLink {
    card: CardInstance;
    effect: string;
    player: "player" | "opponent";
}
