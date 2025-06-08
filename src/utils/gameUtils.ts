import type { GameStore } from "@/store/gameStore";
import type { Card, CardInstance } from "@/types/card";
import type { GameState } from "@/types/game";
import { v4 as uuidv4 } from "uuid";
import { getLinkMonsterSummonalble } from "@/components/SummonSelector";

export const createCardInstance = (card: Card, location: CardInstance["location"], isToken?: boolean): CardInstance => {
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
        isToken,
    };
};

export const getLevel = (cardInstance: CardInstance) => {
    const level = (cardInstance.card as { level?: number })?.level ?? -9999;
    return cardInstance.buf.level + level;
};

export const getAttack = (state: GameStore, cardInstance: CardInstance) => {
    const attack = (cardInstance.card as { attack?: number })?.attack ?? -9999;
    console.log(attack);
    console.log(
        (cardInstance.equipped ?? []).map((id) => {
            return state.field.spellTrapZones.find((equip) => equip?.id === id)?.buf.attack ?? 0;
        })
    );
    const equip = (cardInstance.equipped ?? [])
        .map((id) => {
            return state.field.spellTrapZones.find((equip) => equip?.id === id)?.buf.attack ?? 0;
        })
        .reduce((prev, cur) => prev + cur, 0);

    return cardInstance.buf.attack + attack + equip;
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

export const canLinkSummonAfterRelease = (
    materials: CardInstance[],
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
) => {
    console.log("materials:", materials);
    console.log("extraMonsterZones:", extraMonsterZones);
    console.log("monsterZones:", monsterZones);

    const tempMonsterZones = [...monsterZones];
    const tempExtraMonsterZones = [...extraMonsterZones];

    for (const material of materials) {
        const monsterIndex = tempMonsterZones.findIndex((zone) => zone?.id === material.id);
        if (monsterIndex !== -1) {
            tempMonsterZones[monsterIndex] = null;
        } else {
            const extraIndex = tempExtraMonsterZones.findIndex((zone) => zone?.id === material.id);
            if (extraIndex !== -1) {
                tempExtraMonsterZones[extraIndex] = null;
            }
        }
    }
    console.log("tempEx", tempExtraMonsterZones);
    console.log("tempMon", tempMonsterZones);
    const availableZones = getLinkMonsterSummonalble(tempExtraMonsterZones, tempMonsterZones);
    console.log(availableZones);
    if (availableZones.length > 0) {
        return true;
    }
    return false;
};

export const searchCombinationLinkSummon = (
    linkCard: CardInstance,
    extraMonsterZones: (CardInstance | null)[],
    monsterZones: (CardInstance | null)[]
): boolean => {
    const availableMaterials = [
        ...monsterZones.filter((zone) => zone !== null),
        ...extraMonsterZones.filter((zone) => zone !== null),
    ] as CardInstance[];

    if (availableMaterials.length === 0) return false;

    const linkRating = (linkCard.card as { link?: number }).link;
    if (!linkRating) return false;

    const generateCombinations = (arr: CardInstance[], size: number): CardInstance[][] => {
        if (size === 0) return [[]];
        if (arr.length === 0) return [];

        const result: CardInstance[][] = [];
        for (let i = 0; i < arr.length; i++) {
            const rest = arr.slice(i + 1);
            const combos = generateCombinations(rest, size - 1);
            for (const combo of combos) {
                result.push([arr[i], ...combo]);
            }
        }
        return result;
    };

    for (let materialCount = 1; materialCount <= Math.min(availableMaterials.length, linkRating); materialCount++) {
        const combinations = generateCombinations(availableMaterials, materialCount);

        for (const materials of combinations) {
            if (canLinkSummonByMaterials(linkCard, materials)) {
                if (canLinkSummonAfterRelease(materials, extraMonsterZones, monsterZones)) {
                    return true;
                }
            }
        }
    }

    return false;
};

export const canLinkSummonByMaterials = (linkCard: CardInstance, materials: CardInstance[]) => {
    switch (linkCard.card.card_name) {
        case "幻獣機アウローラドン": {
            const race = materials.filter((e) => (e.card as { race: string }).race === "機械族");
            const rankCondition = calcCanSummonLink(materials).includes(3);
            return race.length >= 2 && rankCondition;
        }
        case "警衛バリケイドベルグ": {
            const race =
                materials.length === 2 && Array.from(new Set(materials.map((e) => e.card.card_name))).length === 2;
            const rankCondition = calcCanSummonLink(materials).includes(2);
            return race && rankCondition;
        }
        case "ユニオン・キャリアー": {
            const typed = materials as { card: { race: string; attribute: string } }[];
            const race =
                materials.length === 2 &&
                (typed[0].card.race === typed[1].card.race || typed[0].card.attribute === typed[1].card.attribute);
            const rankCondition = calcCanSummonLink(materials).includes(2);
            return race && rankCondition;
        }
        case "転生炎獣アルミラージ": {
            const race = materials.length === 1 && materials[0].summonedBy == "normal";
            const rankCondition = calcCanSummonLink(materials).includes(1);
            return race && rankCondition;
        }
        case "リンクリボー": {
            const race = materials.length === 1 && (materials[0] as { card: { level: number } }).card.level === 1;
            const rankCondition = calcCanSummonLink(materials).includes(1);
            return race && rankCondition;
        }
        default: {
            return false;
        }
    }
};

export const calcCanSummonLink = (cards: CardInstance[]) => {
    let availableSummonLink: number[] = [0];
    for (const card of cards) {
        const link = (card.card as { link?: number }).link ?? 1;
        if (link >= 2) {
            availableSummonLink = availableSummonLink.map((e) => [e, e + 1, e + link]).flat();
        } else {
            availableSummonLink = availableSummonLink.map((e) => [e, e + 1]).flat();
        }
    }
    return availableSummonLink;
};

export const isSpellCard = (card: Card): boolean => {
    const spellTypes = ["通常魔法", "速攻魔法", "永続魔法", "フィールド魔法", "装備魔法", "儀式魔法"];

    return spellTypes.includes(card.card_type);
};

export const isTrapCard = (card: Card): boolean => {
    const trapTypes = ["通常罠カード", "永続罠カード", "カウンター罠カード"];

    return trapTypes.includes(card.card_type);
};
