import type { Card } from "@/class/cards";

export type CardType =
    | "通常モンスター"
    | "通常モンスター（チューナー）"
    | "効果モンスター"
    | "効果モンスター（チューナー）"
    | "特殊召喚・効果モンスター"
    | "儀式・効果モンスター"
    | "融合モンスター"
    | "シンクロモンスター"
    | "エクシーズモンスター"
    | "リンクモンスター"
    | "通常魔法"
    | "速攻魔法"
    | "永続魔法"
    | "フィールド魔法"
    | "装備魔法"
    | "儀式魔法"
    | "通常罠カード"
    | "永続罠カード"
    | "カウンター罠カード";

export type Attribute = "闇属性" | "光属性" | "炎属性" | "水属性" | "風属性" | "地属性";

export type Race = "魔法使い族" | "機械族" | "鳥獣族" | "悪魔族" | "天使族" | "戦士族" | "サイバース族" | "岩石族";

export interface BaseCard {
    id: string;
    card_name: string;
    card_type: CardType;
    text: string;
    limit_status: string;
    errata: string;
    quantity: number;
    image?: string;
}

export interface MonsterCard extends BaseCard {
    level?: number;
    rank?: number;
    link?: number;
    link_markers?: string;
    attribute: Attribute;
    race: Race;
    attack: number;
    defense?: number;
    material?: string;
    special_summon?: string;
    summon_condition?: string;
}

export interface SpellTrapCard extends BaseCard {
    card_type: Extract<
        CardType,
        | "通常魔法"
        | "速攻魔法"
        | "永続魔法"
        | "フィールド魔法"
        | "装備魔法"
        | "儀式魔法"
        | "通常罠カード"
        | "永続罠カード"
        | "カウンター罠カード"
    >;
}
export interface DeckData {
    deck_name: string;
    main_deck: Card[];
    extra_deck: Card[];
}

export type CardLocation =
    | "deck"
    | "hand"
    | "field_monster"
    | "field_spell_trap"
    | "graveyard"
    | "banished"
    | "extra_deck"
    | "material";


// Card interface is now imported from @/class/cards

type Location = "Deck" | "Hand" | "MonsterField" | "SpellField" | "ExtraDeck" | "Exclusion" | "Graveyard";

export interface CardInstance {
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
    isToken?: boolean;
}

type SummonedBy = "Normal" | "Special" | "Link" | "Xyz" | undefined;
