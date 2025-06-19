import { expandDeckList, type Deck } from "@/data/deckUtils";
import cardMap from "@/data/cards/cardMap";

const DECK_CONFIG = {
    deck_name: "ドグマブレード",
    main_deck: [
        // Monsters
        { card_name: "D-HERO ドグマガイ", quantity: 3 },
        { card_name: "サイバー・ヴァリー", quantity: 2 },
        { card_name: "E・HERO エアーマン", quantity: 1 },
        { card_name: "光帝クライス", quantity: 1 },
        { card_name: "D-HERO ディスクガイ", quantity: 1 },
        { card_name: "混沌の黒魔術師", quantity: 1 },
        // Spells
        { card_name: "死者蘇生", quantity: 1 },
        { card_name: "モンスターゲート", quantity: 3 },
        { card_name: "名推理", quantity: 3 },
        { card_name: "デステニー・ドロー", quantity: 3 },
        { card_name: "手札抹殺", quantity: 1 },
        { card_name: "アームズ・ホール", quantity: 3 },
        { card_name: "トレード・イン", quantity: 2 },
        { card_name: "神剣-フェニックス・ブレード", quantity: 2 },
        { card_name: "増援", quantity: 2 },
        { card_name: "封印の黄金櫃", quantity: 1 },
        { card_name: "D・D・R", quantity: 2 },
        { card_name: "魔法石の採掘", quantity: 2 },
        { card_name: "早すぎた埋葬", quantity: 10 },

        { card_name: "ハリケーン", quantity: 1 },
        { card_name: "次元融合", quantity: 1 },
        { card_name: "魔力倹約術", quantity: 1 },
        // trap
        { card_name: "マジカル・エクスプロージョン", quantity: 2 },
    ],
    extra_deck: [],
    token: [],
};
export default {
    deck_name: DECK_CONFIG.deck_name,
    main_deck: expandDeckList(DECK_CONFIG.main_deck, cardMap),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck, cardMap),
    token: expandDeckList(DECK_CONFIG.token, cardMap),
    rules: ["start_six_hand"],
} satisfies Deck;
