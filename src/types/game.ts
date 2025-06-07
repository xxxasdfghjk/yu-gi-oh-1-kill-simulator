import type { CardInstance } from "./card";

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
    hasActivatedExtravagance: boolean;
    hasActivatedChickenRace: boolean;
    hasActivatedFafnir: boolean;
    hasActivatedBanAlpha: boolean;
    hasActivatedCritter: boolean;
    hasActivatedEmergencyCyber: boolean;
    hasActivatedEruGanma: boolean;
    hasActivatedAruZeta: boolean;
    hasActivatedJackInTheHand: boolean;
    hasActivatedFafnirSummonEffect: boolean;
    hasActivatedDreitronNova: boolean;
    hasActivatedDivinerSummonEffect: boolean;
    isOpponentTurn: boolean;
    pendingTrapActivation: CardInstance | null;
    bonmawashiRestriction: boolean;
    currentChain: ChainLink[];
    canActivateEffects: boolean;
    gameOver: boolean;
    winner: "player" | "timeout" | null;
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
    meteorKikougunState: {
        phase: "select_ritual_monster" | "select_materials";
        selectedRitualMonster?: CardInstance;
        requiredAttack?: number;
        availableRitualMonsters?: CardInstance[];
        availableMaterials?: CardInstance[];
        selectedMaterials?: CardInstance[];
    } | null;
}

export interface ChainLink {
    card: CardInstance;
    effect: string;
    player: "player" | "opponent";
}
