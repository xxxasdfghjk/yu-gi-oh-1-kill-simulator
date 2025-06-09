import type { GameStore } from "@/store/gameStore";
import type { CardInstance, Location } from "@/types/card";

type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

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
export type Buf = { attack: number; defense: number; level: number };
export const addBuf = (state: GameStore, card: CardInstance, buf: Buf) => {
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones?.[i]?.id === card.id) {
            const tar = state.field.monsterZones[i]!;
            const newBuf = {
                attack: buf.attack + tar.buf.attack,
                defense: buf.defense + tar.buf.defense,
                level: buf.level + tar.buf.level,
            };
            state.field.monsterZones[i] = { ...state.field.monsterZones[i], buf: newBuf } as CardInstance;
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            const tar = state.field.extraMonsterZones[i]!;
            const newBuf = {
                attack: buf.attack + tar.buf.attack,
                defense: buf.defense + tar.buf.defense,
                level: buf.level + tar.buf.level,
            };
            const newInstance = {
                ...state.field.extraMonsterZones[i],
                buf: newBuf,
            };
            state.field.extraMonsterZones[i] = newInstance as CardInstance;
        }
    }
};

export const releaseCard = (state: GameStore, card: CardInstance) => {
    sendCard(state, card, "Graveyard");
    console.log(card);
    card.card.effect?.onRelease?.(state, card);
};

export const sendCard = (state: GameStore, card: CardInstance, to: Location, option?: { reverse: boolean }) => {
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
                const position = option?.reverse ? "back" : ("attack" satisfies Position);
                state.field.spellTrapZones[emptyZone] = { ...updatedCard, position };
            }
            break;
        }
        case "FieldZone": {
            if (state.field.fieldZone !== null) {
                sendCard(state, state!.field!.fieldZone!, "Graveyard");
            }
            state.field.fieldZone = { ...updatedCard };
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
    monster.card.effect.onSummon?.(state, monster);
    return summonedMonster;
};
