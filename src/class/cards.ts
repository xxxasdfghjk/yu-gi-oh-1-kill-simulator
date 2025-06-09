import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

import { v4 as uuidv4 } from "uuid";

type EffectCallback = (gameState: GameStore, cardInstance: CardInstance) => void;

type ConditionCallback = (gameState: GameStore, cardInstance: CardInstance) => boolean;

export type EffectType = {
    onSpell?: {
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onSummon?: EffectCallback;
    onIgnition?: {
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onRelease?: EffectCallback;
    onFieldToGraveyard?: EffectCallback;
    onAnywhereToGraveyard?: EffectCallback;
    onDestroyByBattle?: EffectCallback;
    onDestroyByEffect?: EffectCallback;
    onActivateEffect?: {
        condition: ConditionCallback;
        effect: EffectCallback;
    };
};
type CardTypeName = "モンスター" | "魔法" | "罠";
export interface Card {
    card_name: string;
    card_type: CardTypeName;
    text: string;
    image: string;
    effect: EffectType;
}

export type SummonedBy = "Normal" | "Special" | "Link" | "Xyz" | undefined;
export type Element = "闇" | "光" | "風" | "炎" | "地"; //など
export type Race = "魔法使い" | "機械" | "悪魔" | "天使" | "サイバース" | "戦士"; // など
type MonsterType =
    | "通常モンスター"
    | "効果モンスター"
    | "エクシーズモンスター"
    | "融合モンスター"
    | "リンクモンスター"
    | "シンクロモンスター"
    | "儀式モンスター";

export type ExtraMonsterType = "エクシーズモンスター" | "融合モンスター" | "リンクモンスター" | "シンクロモンスター";

export type MaterialCondition = (cardInstanceList: CardInstance[]) => boolean;

export interface MonsterCard extends Card {
    card_type: "モンスター";
    monster_type: MonsterType;
    element: Element;
    race: Race;
    attack: number;
    hasLevel: boolean;
    hasRank: boolean;
    hasDefense: boolean;
    canNormalSummon: boolean;
    hasTuner?: boolean;
}
export interface DefensableMonsterCard extends MonsterCard {
    defense: number;
    hasDefense: true;
    hasLink: false;
}

export interface LeveledMonsterCard extends DefensableMonsterCard {
    level: number;
    hasLevel: true;
    hasRank: false;
}

export interface XyzMonsterCard extends DefensableMonsterCard {
    monster_type: "エクシーズモンスター";
    materialCondition: MaterialCondition;
    rank: number;
    hasRank: true;
    hasLevel: false;
    canNormalSummon: false;
}

export interface LinkMonsterCard extends MonsterCard {
    monster_type: "リンクモンスター";
    link: number;
    linkDirection: Direction[];
    hasLink: true;
    hasRank: false;
    hasDefense: false;
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export interface FusionMonsterCard extends LeveledMonsterCard {
    monster_type: "融合モンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export interface SynchroMonsterCard extends LeveledMonsterCard {
    monster_type: "シンクロモンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export type ExtraMonster = LinkMonsterCard | FusionMonsterCard | SynchroMonsterCard | XyzMonsterCard;
export type CommonMonster = LeveledMonsterCard;

export interface LeveledMonsterCard extends DefensableMonsterCard {
    level: number;
    hasLevel: true;
    hasRank: false;
}

export interface XyzMonsterCard extends DefensableMonsterCard {
    monster_type: "エクシーズモンスター";
    materialCondition: MaterialCondition;
    rank: number;
    hasRank: true;
    hasLevel: false;
    canNormalSummon: false;
}
type Direction = "左" | "左下" | "下" | "右下" | "右" | "右上" | "上" | "左上";
export interface LinkMonsterCard extends MonsterCard {
    monster_type: "リンクモンスター";
    link: number;
    linkDirection: Direction[];
    hasLink: true;
    hasRank: false;
    hasDefense: false;
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export interface FusionMonsterCard extends LeveledMonsterCard {
    monster_type: "融合モンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export interface SynchroMonsterCard extends LeveledMonsterCard {
    monster_type: "シンクロモンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export type MagicType = "通常魔法" | "速攻魔法" | "儀式魔法" | "永続魔法" | "装備魔法" | "フィールド魔法";
export interface MagicCard extends Card {
    card_type: "魔法";
    magic_type: MagicType;
}

export type TrapType = "通常罠" | "カウンター罠" | "永続罠";

export interface TrapCard extends Card {
    card_type: "罠";
    trap_type: TrapType;
}

type Location = "Deck" | "Hand" | "MonsterField" | "SpellField" | "ExtraDeck" | "Exclusion" | "Graveyard";
type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

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

const markTurnOnceUsedEffect = (gameStore: GameStore, effectId: string) => {
    if (!gameStore.turnOnceUsedEffectMemo) {
        gameStore.turnOnceUsedEffectMemo = {};
    }
    gameStore.turnOnceUsedEffectMemo[effectId] = true;
};

const checkTurnOnceUsedEffect = (gameStore: GameStore, effectId: string) => {
    return gameStore.turnOnceUsedEffectMemo?.[effectId] === true;
};

export const withTurnAtOneceCondition = (
    state: GameStore,
    cardInstance: CardInstance,
    callback: ConditionCallback,
    effectId: string | undefined = undefined
) => {
    const id = effectId ?? cardInstance.card.card_name;
    const alreadyUsed = checkTurnOnceUsedEffect(state, id);
    if (alreadyUsed) {
        return false;
    } else {
        return callback(state, cardInstance);
    }
};

export const withTurnAtOneceEffect = (
    state: GameStore,
    cardInstance: CardInstance,
    callback: EffectCallback,
    effectId: string | undefined = undefined
) => {
    const id = effectId ?? cardInstance.card.card_name;
    markTurnOnceUsedEffect(state, id);
    return callback(state, cardInstance);
};

export const withOption = <T extends string>(
    state: GameStore,
    card: CardInstance,
    options: { name: T; condition: ConditionCallback }[],
    callback: (state: GameStore, card: CardInstance, option: T) => void
) => {
    // Add option selection to effect queue
    const availableOptions = options.filter((opt) => opt.condition(state, card));
    if (availableOptions.length === 0) return;

    state.effectQueue.push({
        id: uuidv4(),
        type: "option",
        effectName: `${card.card.card_name}（選択肢）`,
        cardInstance: card,
        option: availableOptions.map((opt) => ({ name: opt.name, value: opt.name })),
        effectType: "with_option_callback",
        canCancel: false,
        callback: (state: GameStore, cardInstance: CardInstance, selectedOption: string) => {
            callback(state, cardInstance, selectedOption as T);
        },
    });
};

export const withUserSelectCard = (
    state: GameStore,
    card: CardInstance,
    cardOption: CardInstance[],
    option: { select: "single" | "multi"; condition?: (cards: CardInstance[], state: GameStore) => boolean },
    callback: (state: GameStore, cardInstance: CardInstance, selected: CardInstance[]) => void
) => {
    // Add card selection to effect queue
    if (cardOption.length === 0) return;

    state.effectQueue.push({
        id: uuidv4(),
        type: option.select === "single" ? "select" : "multiselect",
        effectName: `${card.card.card_name}（カード選択）`,
        cardInstance: card,
        getAvailableCards: () => cardOption,
        condition: option.condition
            ? (cards: CardInstance[]) => option.condition!(cards, state)
            : (cards: CardInstance[]) => (option.select === "single" ? cards.length === 1 : cards.length >= 1),
        effectType: "with_user_select_card_callback",
        canCancel: false,
        callback: (state: GameStore, cardInstance: CardInstance, selectedCards: CardInstance[]) => {
            callback(state, cardInstance, selectedCards);
        },
    });
};

export const withUserConfirm = (
    state: GameStore,
    card: CardInstance,
    option: { message?: string },
    callback: (state: GameStore, cardInstance: CardInstance) => void
) => {
    // Add confirmation to effect queue
    state.effectQueue.push({
        id: uuidv4(),
        type: "confirm",
        effectName: option.message || `${card.card.card_name}（確認）`,
        cardInstance: card,
        getAvailableCards: () => [],
        condition: () => true,
        effectType: "with_user_confirm_callback",
        canCancel: true,
        callback: (state: GameStore, cardInstance: CardInstance, confirmed: boolean) => {
            if (confirmed) {
                callback(state, cardInstance);
            }
        },
    });
};

export const sumLevel = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLevelMonsterFilter(e.card) ? e.card.level : 0)).reduce((prev, cur) => cur + prev, 0);

export const sumLink = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLinkMonsterFilter(e.card) ? e.card.link : 1)).reduce((prev, cur) => cur + prev, 0);

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

export const hasCardWithName = (cardList: CardInstance[], cardName: string): boolean => {
    return cardList.some((card) => card.card.card_name === cardName);
};

export const getCardsWithName = (cardList: CardInstance[], cardName: string): CardInstance[] => {
    return cardList.filter((card) => card.card.card_name === cardName);
};

export const isMagicCard = (card: Card): card is MagicCard => {
    return card.card_type === "魔法";
};

export const isTrapCard = (card: Card): card is TrapCard => {
    return card.card_type === "罠";
};

export const isRitualMonster = (card: Card): boolean => {
    return monsterFilter(card) && card.monster_type === "儀式モンスター";
};

export const draitronIgnitionCondition = (gameState: GameStore, cardInstance: CardInstance): boolean => {
    // Must be in hand or graveyard
    if (cardInstance.location !== "Hand" && cardInstance.location !== "Graveyard") return false;

    // Once per turn check
    if (!withTurnAtOneceCondition(gameState, cardInstance, () => true)) return false;

    // Need a Draitron or Ritual monster to release (excluding this card)
    const releaseTargets = [
        ...gameState.hand,
        ...gameState.field.monsterZones.filter((c) => c !== null),
        ...gameState.field.extraMonsterZones.filter((c) => c !== null),
    ]
        .filter((card) => card && card.id !== cardInstance.id)
        .filter((card) => {
            if (!card || !monsterFilter(card.card)) return false;
            return card.card.card_name.includes("竜輝巧") || card.card.monster_type === "儀式モンスター";
        });

    return releaseTargets.length > 0;
};

export const getDraitronReleaseTargets = (gameState: GameStore, cardInstance: CardInstance): CardInstance[] => {
    return [
        ...gameState.hand,
        ...gameState.field.monsterZones.filter((c) => c !== null),
        ...gameState.field.extraMonsterZones.filter((c) => c !== null),
    ]
        .filter((card) => card && card.id !== cardInstance.id)
        .filter((card) => {
            if (!card || !monsterFilter(card.card)) return false;
            return card.card.card_name.includes("竜輝巧") || card.card.monster_type === "儀式モンスター";
        });
};

// Trigger effects based on card movement
export const triggerEffects = (state: GameStore, card: CardInstance, from: Location, to: Location) => {
    const effect = card.card.effect;

    // Field to Graveyard effects
    if (from === "MonsterField" && to === "Graveyard" && effect.onFieldToGraveyard) {
        effect.onFieldToGraveyard(state, card);
    }

    // Anywhere to Graveyard effects
    if (to === "Graveyard" && effect.onAnywhereToGraveyard) {
        effect.onAnywhereToGraveyard(state, card);
    }
};

export const sendCard = (state: GameStore, card: CardInstance, to: Location) => {
    const originalLocation = card.location;

    // If the card is leaving the field and has equipment, send equipment to graveyard
    const isLeavingField =
        (card.location === "MonsterField" || card.location === "SpellField") &&
        to !== "MonsterField" &&
        to !== "SpellField";

    if (isLeavingField && card.equipment && card.equipment.length > 0) {
        // Send all equipped cards to graveyard using sendCard recursively
        const equipmentCopy = [...card.equipment]; // Make a copy to avoid modification during iteration
        equipmentCopy.forEach((equipmentCard) => {
            sendCard(state, equipmentCard, "Graveyard");
        });
        // Clear the equipment array
        card.equipment = [];
    }

    // Remove from current location
    excludeFromAnywhere(state, card);

    // Update card location and add to new location
    const updatedCard = { ...card, location: to };

    switch (to) {
        case "Deck":
            state.deck.push(updatedCard);
            break;
        case "Hand":
            state.hand.push(updatedCard);
            break;
        case "Graveyard":
            state.graveyard.push(updatedCard);
            break;
        case "Exclusion":
            state.banished.push(updatedCard);
            break;
        case "ExtraDeck":
            state.extraDeck.push(updatedCard);
            break;
        case "MonsterField":
            // This should be handled by summon function
            console.warn("Use summon() function for MonsterField");
            break;
        case "SpellField": {
            // Find empty spell/trap zone
            const emptyZone = state.field.spellTrapZones.findIndex((zone) => zone === null);
            if (emptyZone !== -1) {
                state.field.spellTrapZones[emptyZone] = updatedCard;
            }
            break;
        }
    }

    // Trigger effects after the card has been moved
    triggerEffects(state, updatedCard, originalLocation, to);
};

// Remove card from any location and return where it was
export const excludeFromAnywhere = (state: GameStore, card: CardInstance): Location => {
    let originalLocation: Location = card.location;

    // Remove from hand
    const handIndex = state.hand.findIndex((c) => c.id === card.id);
    if (handIndex !== -1) {
        state.hand.splice(handIndex, 1);
        originalLocation = "Hand";
    }

    // Remove from deck
    const deckIndex = state.deck.findIndex((c) => c.id === card.id);
    if (deckIndex !== -1) {
        state.deck.splice(deckIndex, 1);
        originalLocation = "Deck";
    }

    // Remove from graveyard
    const graveyardIndex = state.graveyard.findIndex((c) => c.id === card.id);
    if (graveyardIndex !== -1) {
        state.graveyard.splice(graveyardIndex, 1);
        originalLocation = "Graveyard";
    }

    // Remove from banished
    const banishedIndex = state.banished.findIndex((c) => c.id === card.id);
    if (banishedIndex !== -1) {
        state.banished.splice(banishedIndex, 1);
        originalLocation = "Exclusion";
    }

    // Remove from extra deck
    const extraDeckIndex = state.extraDeck.findIndex((c) => c.id === card.id);
    if (extraDeckIndex !== -1) {
        state.extraDeck.splice(extraDeckIndex, 1);
        originalLocation = "ExtraDeck";
    }

    // Remove from monster zones
    for (let i = 0; i < state.field.monsterZones.length; i++) {
        if (state.field.monsterZones[i]?.id === card.id) {
            state.field.monsterZones[i] = null;
            originalLocation = "MonsterField";
            break;
        }
    }

    // Remove from extra monster zones
    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            state.field.extraMonsterZones[i] = null;
            originalLocation = "MonsterField";
            break;
        }
    }

    // Remove from spell/trap zones
    for (let i = 0; i < state.field.spellTrapZones.length; i++) {
        if (state.field.spellTrapZones[i]?.id === card.id) {
            state.field.spellTrapZones[i] = null;
            originalLocation = "SpellField";
            break;
        }
    }

    // Remove from field zone
    if (state.field.fieldZone?.id === card.id) {
        state.field.fieldZone = null;
        originalLocation = "SpellField";
    }

    // Remove from materials of monsters on field
    const allFieldMonsters = [
        ...state.field.monsterZones.filter((zone): zone is CardInstance => zone !== null),
        ...state.field.extraMonsterZones.filter((zone): zone is CardInstance => zone !== null),
    ];

    for (const monster of allFieldMonsters) {
        if (monster && monster.materials) {
            const materialIndex = monster.materials.findIndex((material) => material.id === card.id);
            if (materialIndex !== -1) {
                monster.materials.splice(materialIndex, 1);
                originalLocation = "MonsterField";
                break;
            }
        }
    }

    // Remove this card from equipment arrays of all monsters on field
    for (const monster of allFieldMonsters) {
        if (monster && monster.equipment) {
            const equipmentIndex = monster.equipment.findIndex((equipment) => equipment.id === card.id);
            if (equipmentIndex !== -1) {
                monster.equipment.splice(equipmentIndex, 1);
                // If this was the only equipment reference, we found it
                break;
            }
        }
    }

    return originalLocation;
};

// Release/tribute a monster (triggers onRelease effect)
export const releaseCard = (state: GameStore, card: CardInstance, to: Location = "Graveyard") => {
    // Trigger release effect before moving the card
    if (card.card.effect.onRelease) {
        card.card.effect.onRelease(state, card);
    }

    // Send the card to the specified location (usually graveyard)
    sendCard(state, card, to);
};

// Destroy a card by battle (triggers onDestroyByBattle effect)
export const destroyByBattle = (state: GameStore, card: CardInstance, to: Location = "Graveyard") => {
    // Trigger battle destruction effect before moving the card
    if (card.card.effect.onDestroyByBattle) {
        card.card.effect.onDestroyByBattle(state, card);
    }

    // Send the card to the specified location (usually graveyard)
    sendCard(state, card, to);
};

// Destroy a card by effect (triggers onDestroyByEffect effect)
export const destroyByEffect = (state: GameStore, card: CardInstance, to: Location = "Graveyard") => {
    // Trigger effect destruction effect before moving the card
    if (card.card.effect.onDestroyByEffect) {
        card.card.effect.onDestroyByEffect(state, card);
    }

    // Send the card to the specified location (usually graveyard)
    sendCard(state, card, to);
};

export const banish = (state: GameStore, card: CardInstance) => {
    excludeFromAnywhere(state, card);
    const banishedCard = { ...card, location: "Exclusion" as const };
    state.banished.push(banishedCard);
};

export const banishFromRandomExtractDeck = (state: GameStore, excludeNum: number) => {
    const target = Array.from({ length: state.extraDeck.length })
        .map((_, i) => ({ i, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand)
        .slice(0, excludeNum)
        .map((e) => e.i);
    const targetCardList = state.extraDeck.filter((_, i) => target.includes(i));
    for (const card of targetCardList) {
        banish(state, card);
    }
};

export const summon = (state: GameStore, monster: CardInstance, zone: number, position: Position) => {
    // Remove from current location
    excludeFromAnywhere(state, monster);

    // Create summoned monster instance
    const summonedMonster = {
        ...monster,
        position,
        location: "MonsterField" as const,
        summonedBy: "Special" as const,
    };

    // Place in appropriate zone
    if (zone >= 0 && zone <= 4) {
        state.field.monsterZones[zone] = summonedMonster;
    } else if (zone === 5 || zone === 6) {
        state.field.extraMonsterZones[zone - 5] = summonedMonster;
    }

    return summonedMonster;
};

export const withUserSummon = (
    state: GameStore,
    card: CardInstance,
    monster: CardInstance,
    callback: (state: GameStore, card: CardInstance, monster: CardInstance) => void
) => {
    // Add summon selection to effect queue
    state.effectQueue.push({
        id: uuidv4(),
        type: "summon",
        cardInstance: monster,
        effectType: "with_user_summon_callback",
        canSelectPosition: true,
        optionPosition: ["attack", "defense"],
        callback: (state: GameStore, cardInstance: CardInstance, result: { zone: number; position: Position }) => {
            const summonResult = summon(state, monster, result.zone, result.position);
            callback(state, card, summonResult);
        },
    });
};

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

// Additional helper functions used in card effects
export const searchFromDeck = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.deck.filter(filter);
};

export const searchFromGraveyard = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.graveyard.filter(filter);
};

export const searchFromHand = (state: GameStore, filter: (card: CardInstance) => boolean): CardInstance[] => {
    return state.hand.filter(filter);
};

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
