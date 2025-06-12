import type { DisplayField } from "@/const/card";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance, Location } from "@/types/card";
import { getPrioritySetSpellTrapZoneIndex } from "./gameUtils";

type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

// Trigger effects based on card movement
export const triggerEffects = (state: GameStore, card: CardInstance, from: Location, to: Location) => {
    const effect = card.card.effect;

    // Field to Graveyard effects
    if ((from === "MonsterField" || from === "FieldZone") && to === "Graveyard" && effect.onFieldToGraveyard) {
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
    card.card.effect?.onRelease?.(state, card);
};

export const equipCard = (state: GameStore, equipMonster: CardInstance, equippedCard: CardInstance) => {
    const equipment = { ...equippedCard, location: "FieldZone" as const };
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] !== null && state.field.monsterZones[i]?.id === equipMonster.id) {
            state.field.monsterZones[i]?.equipment.push(equipment);
        }
    }
    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] !== null && state.field.extraMonsterZones[i]?.id === equipMonster.id) {
            state.field.extraMonsterZones[i]?.equipment.push(equipment);
        }
    }
};

export const getSpellTrapZoneIndex = (state: GameStore, card: CardInstance) => {
    for (let i = 0; i < 5; i++) {
        if (state.field?.spellTrapZones[i]?.id === card.id) {
            return i;
        }
    }
    return -1;
};

export const sendCard = (
    state: GameStore,
    card: CardInstance,
    to: Location,
    option?: { reverse?: boolean; spellFieldIndex?: number }
) => {
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
    }

    // Remove from current location
    const from = excludeFromAnywhere(state, card);

    state.currentFrom = { ...from, position: card.position };
    if (card.isToken === true && to === "Graveyard") {
        // トークンは墓地に送られる代わりにゲームから除外される（AnimatePresenceが削除を処理）
        // フィールドからは既に除外されているので、何もしない
        state.currentTo = { location: "TokenRemove", index: from.index };
        return;
    }

    // Update card location and add to new location
    const updatedCard = {
        ...card,
        location: to,
        position: option?.reverse ? "back" : undefined,
        equipment: [],
    } satisfies CardInstance;

    switch (to) {
        case "Deck":
            state.currentTo = { location: "Deck" };
            state.deck.push(updatedCard);
            break;
        case "Hand":
            state.currentTo = { location: "Hand", index: state.hand.length, length: state.hand.length + 1 };
            state.hand.push(updatedCard);

            break;
        case "Graveyard":
            state.currentTo = { location: "Graveyard" };
            state.graveyard.push(updatedCard);
            break;
        case "Exclusion":
            state.currentTo = { location: "Graveyard" };
            state.banished.push(updatedCard);
            break;
        case "ExtraDeck":
            state.currentTo = { location: "ExtraDeck" };
            state.extraDeck.push(updatedCard);
            break;
        case "MonsterField":
            // This should be handled by summon function
            break;
        case "SpellField": {
            // Find empty spell/trap zone
            if (option?.spellFieldIndex !== undefined) {
                const position = option?.reverse ? "back" : ("attack" satisfies Position);
                state.currentTo = { location: "SpellField", index: option.spellFieldIndex };
                state.field.spellTrapZones[option.spellFieldIndex] = { ...updatedCard, position };
            } else {
                const emptyZone = getPrioritySetSpellTrapZoneIndex(state);
                if (emptyZone !== -1) {
                    const position = option?.reverse ? "back" : ("attack" satisfies Position);
                    state.currentTo = { location: "SpellField", index: emptyZone };
                    state.field.spellTrapZones[emptyZone] = { ...updatedCard, position };
                }
            }
            break;
        }
        case "FieldZone": {
            if (state.field.fieldZone !== null) {
                sendCard(state, state!.field!.fieldZone!, "Graveyard");
            }
            state.currentTo = { location: "FieldZone" };
            state.field.fieldZone = { ...updatedCard };
            break;
        }
        case "OpponentField": {
            state.currentTo = { location: "OpponentField" };
            state.opponentField.fieldZone = { ...updatedCard };
        }
    }
    // Trigger effects after the card has been moved
    triggerEffects(state, updatedCard, originalLocation, to);
};

// Remove card from any location and return where it was
export const excludeFromAnywhere = (
    state: GameStore,
    card: CardInstance
): { location: DisplayField; index?: number; length?: number } => {
    let result: { location: DisplayField; index?: number; length?: number } = {
        location: card.location as DisplayField,
        index: undefined,
        length: undefined,
    };
    // Remove from hand
    const handIndex = state.hand.findIndex((c) => c.id === card.id);
    if (handIndex !== -1) {
        const length = state.hand.length;
        state.hand.splice(handIndex, 1);
        result = { location: "Hand", index: handIndex, length };
    }

    // Remove from deck
    const deckIndex = state.deck.findIndex((c) => c.id === card.id);
    if (deckIndex !== -1) {
        state.deck.splice(deckIndex, 1);
        result = { location: "Deck" };
    }

    // Remove from graveyard
    const graveyardIndex = state.graveyard.findIndex((c) => c.id === card.id);
    if (graveyardIndex !== -1) {
        state.graveyard.splice(graveyardIndex, 1);
        result = { location: "Graveyard" };
    }

    // Remove from banished
    const banishedIndex = state.banished.findIndex((c) => c.id === card.id);
    if (banishedIndex !== -1) {
        state.banished.splice(banishedIndex, 1);
        //TODO:除外ゾーン
        result = { location: "Graveyard" };
    }

    // Remove from extra deck
    const extraDeckIndex = state.extraDeck.findIndex((c) => c.id === card.id);
    if (extraDeckIndex !== -1) {
        state.extraDeck.splice(extraDeckIndex, 1);
        result = { location: "ExtraDeck" };
    }

    // Remove from monster zones
    for (let i = 0; i < state.field.monsterZones.length; i++) {
        if (state.field.monsterZones[i]?.id === card.id) {
            state.field.monsterZones[i] = null;
            result = { location: "MonsterField", index: i };
            break;
        }
    }

    // Remove from extra monster zones
    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
        if (state.field.extraMonsterZones[i]?.id === card.id) {
            state.field.extraMonsterZones[i] = null;
            result = { location: "MonsterField", index: i + 5 };

            break;
        }
    }

    // Remove from spell/trap zones
    for (let i = 0; i < state.field.spellTrapZones.length; i++) {
        if (state.field.spellTrapZones[i]?.id === card.id) {
            state.field.spellTrapZones[i] = null;
            result = { location: "SpellField", index: i };

            break;
        }
    }

    // Remove from field zone
    if (state.field.fieldZone?.id === card.id) {
        state.field.fieldZone = null;
        result = { location: "FieldZone" };
    }

    // materials
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] && state.field.monsterZones[i]?.materials) {
            const materialIndex = state.field.monsterZones[i]!.materials.findIndex(
                (material) => material.id === card.id
            );
            if (materialIndex !== -1) {
                state.field.monsterZones[i]!.materials.splice(materialIndex, 1);
                result = { location: "MonsterField", index: i };
                break;
            }
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] && state.field.extraMonsterZones[i]?.materials) {
            const materialIndex = state.field.extraMonsterZones[i]!.materials.findIndex(
                (material) => material.id === card.id
            );
            if (materialIndex !== -1) {
                state.field.extraMonsterZones[i]!.materials.splice(materialIndex, 1);
                result = { location: "MonsterField", index: i + 5 };
                break;
            }
        }
    }

    // equipment
    for (let i = 0; i < 5; i++) {
        if (state.field.monsterZones[i] && state.field.monsterZones[i]?.equipment) {
            const equipmentIndex = state.field.monsterZones[i]!.equipment.findIndex(
                (equipment) => equipment.id === card.id
            );
            if (equipmentIndex !== -1) {
                state.field.monsterZones[i]!.equipment.splice(equipmentIndex, 1);
                break;
            }
        }
    }

    for (let i = 0; i < 2; i++) {
        if (state.field.extraMonsterZones[i] && state.field.extraMonsterZones[i]?.equipment) {
            const equipmentIndex = state.field.extraMonsterZones[i]!.equipment.findIndex(
                (equipment) => equipment.id === card.id
            );
            if (equipmentIndex !== -1) {
                state.field.extraMonsterZones[i]!.equipment.splice(equipmentIndex, 1);
                break;
            }
        }
    }

    return result;
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

export const getHandIndex = (state: GameStore, card: CardInstance) => {
    if (card.location === "Hand") {
        for (let i = 0; i < state.hand.length; i++) {
            if (state.hand[i].id === card.id) {
                return { index: i, length: state.hand.length };
            }
        }
    }
};

export const summon = (state: GameStore, monster: CardInstance, zone: number, position: Position) => {
    // Remove from current location
    const from = excludeFromAnywhere(state, monster);
    state.currentFrom = { ...from, position };
    // Create summoned monster instance
    const summonedMonster = {
        ...monster,
        position,
        location: "MonsterField" as const,
        summonedBy: "Special" as const,
    };

    // Place in appropriate zone
    if (zone >= 0 && zone <= 4) {
        state.currentTo = { location: "MonsterField", index: zone, position: monster.position };
        state.field.monsterZones[zone] = summonedMonster;
    } else if (zone === 5 || zone === 6) {
        state.currentTo = { location: "MonsterField", index: zone, position: monster.position };
        state.field.extraMonsterZones[zone - 5] = summonedMonster;
    }
    if (summonedMonster.position === "attack" || summonedMonster.position === "defense")
        monster.card.effect.onSummon?.(state, monster);
    return summonedMonster;
};
