import { expandDeckList, type Deck } from "@/data/deckUtils";
import cardMap from "@/data/cards/cardMap";

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
    main_deck: expandDeckList(DECK_CONFIG.main_deck, cardMap),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck, cardMap),
    token: expandDeckList(DECK_CONFIG.token, cardMap),
    rules: ["start_six_hand"],
} satisfies Deck;
