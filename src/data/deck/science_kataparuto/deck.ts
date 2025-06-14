import { expandDeckList, type Deck } from "@/data/deckUtils";
import type { Card } from "@/types/card";

const magicModules = import.meta.glob("./cards/magic/*.ts", { eager: true }) as Record<string, { default: Card }>;
const monsterModules = import.meta.glob("./cards/monster/*.ts", { eager: true }) as Record<string, { default: Card }>;
const extraModules = import.meta.glob("./cards/extra/*.ts", { eager: true }) as Record<string, { default: Card }>;

// Create maps for easy lookup
const magicCardList = Object.values(magicModules).map((e) => e.default);
const monsterCardList = Object.values(monsterModules).map((e) => e.default);
const extraCardList = Object.values(extraModules).map((e) => e.default);
const allCardListMap = [monsterCardList, extraCardList, magicCardList]
    .flat()
    .reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {});

const DECK_CONFIG = {
    deck_name: "サイエンカタパ",
    main_deck: [
        // Monsters
        { card_name: "カタパルト・タートル", quantity: 3 },
        { card_name: "混沌の黒魔術師", quantity: 1 },
        { card_name: "トゥーン・キャノン・ソルジャー", quantity: 1 },
        { card_name: "魔導サイエンティスト", quantity: 1 },

        // Spells
        { card_name: "デビルズ・サンクチュアリ", quantity: 3 },
        { card_name: "トゥーンのもくじ", quantity: 3 },
        { card_name: "ハリケーン", quantity: 3 },
        { card_name: "魔法石の採掘", quantity: 3 },
        { card_name: "名推理", quantity: 3 },
        { card_name: "モンスターゲート", quantity: 3 },
        { card_name: "遺言状", quantity: 3 },
        { card_name: "リロード", quantity: 3 },
        { card_name: "連続魔法", quantity: 3 },
        { card_name: "魔法再生", quantity: 2 },
        { card_name: "強欲な壺", quantity: 1 },
        { card_name: "死者蘇生", quantity: 1 },
        { card_name: "手札抹殺", quantity: 1 },
        { card_name: "天使の施し", quantity: 1 },
        { card_name: "早すぎた埋葬", quantity: 1 },
    ],
    extra_deck: [
        { card_name: "アクア・ドラゴン", quantity: 3 },
        { card_name: "紅陽鳥", quantity: 3 },
        { card_name: "サウザンド・アイズ・サクリファイス", quantity: 3 },
        { card_name: "デス・デーモン・ドラゴン", quantity: 3 },
        { card_name: "ドラゴン・ウォリアー", quantity: 3 },
        { card_name: "魔人 ダーク・バルター", quantity: 3 },
        { card_name: "金色の魔象", quantity: 2 },
        { card_name: "ソウル・ハンター", quantity: 2 },
        { card_name: "ブラキオレイドス", quantity: 2 },
    ],
    token: [],
};
export default {
    deck_name: DECK_CONFIG.deck_name,
    main_deck: expandDeckList(DECK_CONFIG.main_deck, allCardListMap),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck, allCardListMap),
    token: expandDeckList(DECK_CONFIG.token, allCardListMap),
    rules: ["start_six_hand"],
} satisfies Deck;
