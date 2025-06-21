import type { GameStore } from "@/store/gameStore";
import type {
    CardInstance,
    Card,
    MonsterCard,
    LeveledMonsterCard,
    XyzMonsterCard,
    LinkMonsterCard,
    MagicCard,
    TrapCard,
    FusionMonsterCard,
} from "@/types/card";
import { v4 as uuidv4 } from "uuid";

// Type guard functions
export const monsterFilter = (card: Card): card is MonsterCard => {
    return card.card_type === "モンスター";
};

export const hasLevelMonsterFilter = (card: Card): card is LeveledMonsterCard => {
    return monsterFilter(card) && card.hasLevel === true;
};

export const hasRankMonsterFilter = (card: Card): card is XyzMonsterCard => {
    return monsterFilter(card) && card.hasRank === true;
};

export const hasLinkMonsterFilter = (card: Card): card is LinkMonsterCard => {
    return monsterFilter(card) && card.monster_type === "リンクモンスター";
};

export const isMagicCard = (card: Card): card is MagicCard => {
    return card.card_type === "魔法";
};

export const isFusionMonster = (card: Card): card is FusionMonsterCard => {
    return monsterFilter(card) && card.monster_type === "融合モンスター";
};

export const hasEmptySpellField = (state: GameStore) => {
    return state.field.spellTrapZones.filter((e) => e === null).length > 0;
};

export const isLinkMonster = (card: Card): card is LinkMonsterCard => {
    return monsterFilter(card) && card.monster_type === "リンクモンスター";
};

export const isXyzMonster = (card: Card): card is XyzMonsterCard => {
    return monsterFilter(card) && card.monster_type === "エクシーズモンスター";
};

export const isSynchroMonster = (card: Card) => {
    return monsterFilter(card) && card.monster_type === "シンクロモンスター";
};

export const isExodia = (card: Card) => {
    return [
        "封印されしエクゾディア",
        "封印されし者の右腕",
        "封印されし者の左腕",
        "封印されし者の右足",
        "封印されし者の左足",
    ].includes(card.card_name);
};

export const isExtraDeckMonster = (card: Card): card is MonsterCard => {
    return (
        monsterFilter(card) &&
        (card.monster_type === "エクシーズモンスター" ||
            card.monster_type === "シンクロモンスター" ||
            card.monster_type === "リンクモンスター" ||
            card.monster_type === "融合モンスター")
    );
};

export const isTrapCard = (card: Card): card is TrapCard => {
    return card.card_type === "罠";
};

export const isRitualMonster = (card: Card): boolean => {
    return monsterFilter(card) && card.monster_type === "儀式モンスター";
};

// Card instance utilities
export const createCardInstance = (card: Card, location: CardInstance["location"], isToken?: boolean): CardInstance => {
    return {
        card,
        id: uuidv4(),
        location,
        position: undefined,
        materials: [],
        buf: { attack: 0, defense: 0, level: 0 },
        equipment: [],
        summonedBy: undefined,
        isToken,
    };
};

// Level and link calculation utilities
export const sumLevel = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLevelMonsterFilter(e.card) ? e.card.level : 0)).reduce((prev, cur) => cur + prev, 0);

export const sumLink = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLinkMonsterFilter(e.card) ? e.card.link : 1)).reduce((prev, cur) => cur + prev, 0);

// Search utilities
export const searchDeck = (
    state: GameStore,
    filter: (card: CardInstance) => boolean,
    count: number = 1
): CardInstance[] => {
    return state.deck.filter(filter).slice(0, count);
};

export const searchGraveyard = (
    state: GameStore,
    filter: (card: CardInstance) => boolean,
    count: number = 1
): CardInstance[] => {
    return state.graveyard.filter(filter).slice(0, count);
};

export const searchHand = (
    state: GameStore,
    filter: (card: CardInstance) => boolean,
    count: number = 1
): CardInstance[] => {
    return state.hand.filter(filter).slice(0, count);
};

export const searchFromDeck = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.deck.filter(filter);
};

export const searchFromGraveyard = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.graveyard.filter(filter);
};

export const searchFromHand = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.hand.filter(filter);
};

// Field utilities
export const getFieldMonsters = (state: GameStore): CardInstance[] => {
    return [...state.field.monsterZones, ...state.field.extraMonsterZones].filter(
        (zone): zone is CardInstance => zone !== null
    );
};

export const getEmptyMonsterZones = (state: GameStore): number[] => {
    const emptyZones: number[] = [];
    for (let i = 0; i < state.field.monsterZones.length; i++) {
        if (state.field.monsterZones[i] === null) {
            emptyZones.push(i);
        }
    }
    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
        if (state.field.extraMonsterZones[i] === null) {
            emptyZones.push(5 + i);
        }
    }
    return emptyZones;
};
