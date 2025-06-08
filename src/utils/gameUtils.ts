import type { GameStore } from "@/store/gameStore";
import type { Card, CardInstance } from "@/types/card";
import type { GameState } from "@/types/game";
import { v4 as uuidv4 } from "uuid";

export const createCardInstance = (card: Card, location: CardInstance["location"]): CardInstance => {
    return {
        card,
        id: uuidv4(),
        location,
        position: location === "field_monster" ? "attack" : undefined,
        zone: undefined,
        equipped: [],
        counters: 0,
        materials: [],
        buf: { attack: 0, defense: 0, level: 0 },
    };
};

export const getLevel = (cardInstance: CardInstance) => {
    const level = (cardInstance.card as { level?: number })?.level ?? -9999;
    return cardInstance.buf.level + level;
};

export const getAttack = (state: GameStore, cardInstance: CardInstance) => {
    const attack = (cardInstance.card as { attack?: number })?.attack ?? -9999;
    const equip = (cardInstance.equipped ?? [])
        .map((id) => {
            return state.field.spellTrapZones.find((equip) => equip?.id === id)?.buf.attack ?? 0;
        })
        .reduce((prev, cur) => prev + cur, 0);

    return cardInstance.buf.level + attack + equip;
};

export const shuffleDeck = (deck: CardInstance[]): CardInstance[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const drawCards = (gameState: GameState, count: number): GameState => {
    const newDeck = [...gameState.deck];
    const newHand = [...gameState.hand];

    for (let i = 0; i < count && newDeck.length > 0; i++) {
        const drawnCard = newDeck.shift();
        if (drawnCard) {
            drawnCard.location = "hand";
            newHand.push(drawnCard);
        }
    }

    return {
        ...gameState,
        deck: newDeck,
        hand: newHand,
    };
};

export const checkExodiaWin = (hand: CardInstance[]): boolean => {
    const exodiaPieces = [
        "封印されしエクゾディア",
        "封印されし者の右腕",
        "封印されし者の左腕",
        "封印されし者の右足",
        "封印されし者の左足",
    ];

    const handCardNames = hand.map((card) => card.card.card_name);
    return exodiaPieces.every((piece) => handCardNames.includes(piece));
};

export const isMonsterCard = (card: Card): boolean => {
    const monsterTypes = [
        "通常モンスター",
        "通常モンスター（チューナー）",
        "効果モンスター",
        "効果モンスター（チューナー）",
        "特殊召喚・効果モンスター",
        "儀式・効果モンスター",
        "融合モンスター",
        "シンクロモンスター",
        "エクシーズモンスター",
        "リンクモンスター",
    ];

    return monsterTypes.includes(card.card_type);
};

export const isSpellCard = (card: Card): boolean => {
    const spellTypes = ["通常魔法", "速攻魔法", "永続魔法", "フィールド魔法", "装備魔法", "儀式魔法"];

    return spellTypes.includes(card.card_type);
};

export const isTrapCard = (card: Card): boolean => {
    const trapTypes = ["通常罠カード", "永続罠カード", "カウンター罠カード"];

    return trapTypes.includes(card.card_type);
};
