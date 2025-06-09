import type { GameStore } from "@/store/gameStore";

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
    onFieldToGraveyard?: () => EffectCallback;
    onAnywhereTofGraveyard?: () => EffectCallback;
};
type CardTypeName = "モンスター" | "魔法" | "罠";
interface Card {
    card_name: string;
    card_type: CardTypeName;
    text: string;
    image: string;
    effect: EffectType;
}

type SummonedBy = "Normal" | "Special" | "Link" | "Xyz" | undefined;
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

interface MonsterCard extends Card {
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
interface DefensableMonsterCard extends MonsterCard {
    defense: number;
    hasDefense: true;
    hasLink: false;
}

interface LeveledMonsterCard extends DefensableMonsterCard {
    level: number;
    hasLevel: true;
    hasRank: false;
}

interface XyzMonsterCard extends DefensableMonsterCard {
    monster_type: "エクシーズモンスター";
    materialCondition: MaterialCondition;
    rank: number;
    hasRank: true;
    hasLevel: false;
    canNormalSummon: false;
}

interface LinkMonsterCard extends MonsterCard {
    monster_type: "リンクモンスター";
    link: number;
    linkDirection: Direction[];
    hasLink: true;
    hasRank: false;
    hasDefense: false;
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

interface FusionMonsterCard extends LeveledMonsterCard {
    monster_type: "融合モンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

interface SynchroMonsterCard extends LeveledMonsterCard {
    monster_type: "シンクロモンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

export type ExtraMonster = LinkMonsterCard | FusionMonsterCard | SynchroMonsterCard | XyzMonsterCard;
export type CommonMonster = LeveledMonsterCard;

interface LeveledMonsterCard extends DefensableMonsterCard {
    level: number;
    hasLevel: true;
    hasRank: false;
}

interface XyzMonsterCard extends DefensableMonsterCard {
    monster_type: "エクシーズモンスター";
    materialCondition: MaterialCondition;
    rank: number;
    hasRank: true;
    hasLevel: false;
    canNormalSummon: false;
}
type Direction = "左" | "左下" | "下" | "右下" | "右" | "右上" | "上" | "左上";
interface LinkMonsterCard extends MonsterCard {
    monster_type: "リンクモンスター";
    link: number;
    linkDirection: Direction[];
    hasLink: true;
    hasRank: false;
    hasDefense: false;
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

interface FusionMonsterCard extends LeveledMonsterCard {
    monster_type: "融合モンスター";
    materialCondition: MaterialCondition;
    canNormalSummon: false;
}

interface SynchroMonsterCard extends LeveledMonsterCard {
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

type CardInstance = {
    id: string;
    card: Card;
    location: Location;
    position: "back_defense" | "attack" | "back" | "defense" | undefined;
    equipment: CardInstance[];
    summonedBy: SummonedBy;
    buf: {
        level: number;
        attack: number;
        defense: number;
    };
    materials: CardInstance[];
};

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
    gameStore.turnOnceUsedEffectMemo?.[effectId] = true;
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
    checkTurnOnceUsedEffect(state, effectId ?? cardInstance.card.card_name);
    return callback(state, cardInstance);
};

export const withTurnAtOneceEffect = (
    state: GameStore,
    cardInstance: CardInstance,
    callback: EffectCallback,
    effectId: string | undefined = undefined
) => {
    markTurnOnceUsedEffect(state, effectId ?? cardInstance.card.card_name);
    return callback(state, cardInstance);
};

export const withOption = <T extends string>(
    state: GameStore,
    card: CardInstance,
    options: { name: T; condition: ConditionCallback }[],
    callback: (state: GameStore, card: CardInstance, option: T) => void
) => {
    // TODO:UserQueueに渡してoptionを得る
    const option = options[0];
    callback(state, card, option.name);
};

export const withUserSelectCard = (
    state: GameStore,
    card: CardInstance,
    cardOption: CardInstance[],
    option: { select: "single" | "multi"; condition?: (card: CardInstance[], state: GameStore) => boolean },
    callback: (state: GameStore, cardInstance: CardInstance, selected: CardInstance[]) => void
) => {
    // TODO:UserQueueに渡して選択したカードを得る
    const selected = cardOption[0];
    callback(state, card, [selected]);
};

export const sumLevel = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLevelMonsterFilter(e.card) ? e.card.level : 0)).reduce((prev, cur) => cur + prev, 0);

export const sumLink = (cardList: CardInstance[]) =>
    cardList.map((e) => (hasLinkMonsterFilter(e.card) ? e.card.link : 1)).reduce((prev, cur) => cur + prev, 0);

export const sendCard = (state: GameStore, card: CardInstance, to: Location) => {
    // TODO:元のフィールドから取り除く
    const from = excludeFromAnyware(state, card);
    // TODO:アニメーションを実装する
    switch (to) {
        case "Deck":
        case "Hand":
        case "MonsterField":
        case "SpellField":
        case "ExtraDeck":
        case "Exclusion":
            // TODO 実装
            state.hand.push(card);
    }
};

// カードをデータ上消し、元あったカードがいた場所を返す
export const excludeFromAnyware = (state: GameStore, card: CardInstance): Location => {
    // TODO: ちゃんと探す
    return "ExtraDeck";
};

export const banish = (state: GameStore, card: CardInstance, withReverse: boolean = false) => {
    // TODO: 除外するアニメーションを呼ぶ
    // TODO: cardのlocationから除外ゾーンまで動くアニメーション
    const location = excludeFromAnyware(state, card);

    state.banished.push(card);
    // TODO:除外時の効果を発動（あれば）
};

export const banishFromRandomExtractDeck = (state: GameStore, excludeNum: number) => {
    const target = Array.from({ length: state.extraDeck.length })
        .map((_, i) => ({ i, rand: Math.random() }))
        .sort((a, b) => a.rand - b.rand)
        .slice(0, excludeNum)
        .map((e) => e.i);
    const targetCardList = state.extraDeck.filter((_, i) => target.includes(i));
    for (const card of targetCardList) {
        banish(state, card, true);
    }
};

export const summon = (state: GameStore, monster: CardInstance, zone: number, position: Position) => {
    // TODO: 召喚するアニメーションを呼ぶ
    // TODO: cardのlocationから召喚するゾーンまで動くアニメーション
    const newInstance = { ...monster, position, location: "MonsterField" as const };
    if (zone >= 0 && zone <= 4) {
        state.field.monsterZones[zone] = newInstance;
    } else if (zone === 5 || zone === 6) {
        state.field.extraMonsterZones[zone - 5] = newInstance;
    }
    // TODO:登場時の効果を発動（あれば）
    return newInstance;
};

export const withUserSummon = (
    state: GameStore,
    card: CardInstance,
    monster: CardInstance,
    callback: (state: GameStore, card: CardInstance, monster: CardInstance) => void
) => {
    // TODO:召喚時の選択肢を提示して召喚する位置を取得
    const zone = 0;
    const position = "attack";
    const result = summon(state, monster, zone, position);
    callback(state, card, result);
};
