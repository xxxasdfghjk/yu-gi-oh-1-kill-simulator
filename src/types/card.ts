import type { GameStore } from "@/store/gameStore";

export interface DeckData {
    deck_name: string;
    main_deck: Card[];
    extra_deck: Card[];
}

type ContextType = Record<string, number | string> | undefined;

type CardWithStatusArgs = [gameState: GameStore, cardInstance: CardInstance, context?: ContextType];

type EffectCallback = (...args: CardWithStatusArgs) => void | boolean;
type ChainConditionCallback = (
    gameState: GameStore,
    cardInstance: CardInstance,
    chainCardList: CardInstance[]
) => boolean;

type ConditionCallback = (gameState: GameStore, cardInstance: CardInstance) => boolean;
type CostAfterCallback = (
    gameState: GameStore,
    cardInstance: CardInstance,
    context?: Record<string, number | string>
) => void;
type PayCostCallback = (gameState: GameStore, cardInstance: CardInstance, afterCallback: CostAfterCallback) => void;
type OnPayLifeCostCallback = (
    gameState: GameStore,
    cardInstance: CardInstance,
    targetCard: CardInstance,
    lifeCost: number
) => number;

type OnSpellEffectCallback = (
    ...args: [...CardWithStatusArgs, resolve?: (state: GameStore, card: CardInstance) => void]
) => void;

export type EffectType = {
    onSpell?: {
        condition: ConditionCallback;
        payCost?: PayCostCallback;
        effect: OnSpellEffectCallback;
    };
    onSummon?: EffectCallback;
    onIgnition?: {
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onRelease?: EffectCallback;
    onFieldToGraveyard?: EffectCallback;
    onAnywhereToGraveyard?: EffectCallback;
    onAnywhereToGraveyardByEffect?: EffectCallback;
    onDeckToGraveyard?: EffectCallback;
    onHandToGraveyard?: EffectCallback;
    onGraveyardToField?: EffectCallback;
    onDestroyByBattle?: EffectCallback;
    onDestroyByEffect?: EffectCallback;
    onActivateEffect?: {
        condition: ConditionCallback;
        effect: EffectCallback;
    };
    onLeaveField?: EffectCallback;
    onLeaveFieldInstead?: EffectCallback;
    onChain?: {
        condition: ChainConditionCallback;
    };
    onStandbyPhase?: EffectCallback;
    onPayLifeCost?: OnPayLifeCostCallback;
    onCardEffect?: EffectCallback;
    onCardDeckToGraveyard?: EffectCallback;
    onCardToGraveyardByEffect?: EffectCallback;
};

type CardTypeName = "モンスター" | "魔法" | "罠";

export interface Card {
    card_name: string;
    card_type: CardTypeName;
    text: string;
    image: string;
    effect: EffectType;
    originEffect?: EffectType;
}

export type SummonedBy = "Normal" | "Special" | "Link" | "Xyz" | "Synchro" | "Fusion" | undefined;
export type Element = "闇" | "光" | "風" | "炎" | "地" | "水" | "火" | "神";
export type Race =
    | "魔法使い"
    | "機械"
    | "悪魔"
    | "天使"
    | "サイバース"
    | "戦士"
    | "水"
    | "ドラゴン"
    | "幻神獣"
    | "恐竜"
    | "獣"
    | "岩石"
    | "サイキック"
    | "獣戦士"
    | "創造神"
    | "昆虫"
    | "幻竜"
    | "鳥獣";

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
    canUseMaterilForRitualSummon?: true;
    summonLimited?: true;
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

export interface XyzMonsterCard extends DefensableMonsterCard, NeedMaterialMonster {
    monster_type: "エクシーズモンスター";
    rank: number;
    hasRank: true;
    hasLevel: false;
    canNormalSummon: false;
}

export type Direction = "左" | "左下" | "下" | "右下" | "右" | "右上" | "上" | "左上";

interface NeedMaterialMonster {
    materialCondition: MaterialCondition;
    filterAvailableMaterials: (canidate: CardInstance) => boolean;
}

export interface LinkMonsterCard extends MonsterCard, NeedMaterialMonster {
    monster_type: "リンクモンスター";
    link: number;
    linkDirection: Direction[];
    hasLink: true;
    hasRank: false;
    hasDefense: false;
    canNormalSummon: false;
}

export interface FusionMonsterCard extends LeveledMonsterCard, NeedMaterialMonster {
    monster_type: "融合モンスター";
    canNormalSummon: false;
}

export interface SynchroMonsterCard extends LeveledMonsterCard, NeedMaterialMonster {
    monster_type: "シンクロモンスター";
    canNormalSummon: false;
}

export type ExtraMonster = LinkMonsterCard | FusionMonsterCard | SynchroMonsterCard | XyzMonsterCard;
export type CommonMonster = LeveledMonsterCard;

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

type SpecialLocation = "TokenRemove" | "Throne";

export type Location =
    | "Deck"
    | "Hand"
    | "MonsterField"
    | "SpellField"
    | "ExtraDeck"
    | "Exclusion"
    | "Graveyard"
    | "FieldZone"
    | "OpponentField"
    | "Material"
    | SpecialLocation;
type Position = "back_defense" | "attack" | "back" | "defense" | undefined;

export interface CardInstance {
    id: string;
    card: Card;
    location: Location;
    position: Position;
    equipment: CardInstance[];
    summonedBy: SummonedBy;
    buf: {
        level: number;
        attack: number;
        defense: number;
    };
    materials: CardInstance[];
    summonedByMaterials?: Card[];
    isToken?: boolean;
    setTurn?: number;
    isDummy?: true;
    magicCounter?: number;
    effectUse?: string[];
}
