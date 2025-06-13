import { expandDeckList } from "@/data/deckUtils";
import type { Card } from "@/types/card";

const magicModules = import.meta.glob("./cards/magic/*.ts", { eager: true }) as Record<string, { default: Card }>;
const monsterModules = import.meta.glob("./cards/monster/*.ts", { eager: true }) as Record<string, { default: Card }>;
const extraModules = import.meta.glob("./cards/extra/*.ts", { eager: true }) as Record<string, { default: Card }>;
const trapModules = import.meta.glob("./cards/trap/*.ts", { eager: true }) as Record<string, { default: Card }>;
const tokenModules = import.meta.glob("./cards/token/*.ts", { eager: true }) as Record<string, { default: Card }>;

// Create maps for easy lookup
const magicCardList = Object.values(magicModules).map((e) => e.default);
const monsterCardList = Object.values(monsterModules).map((e) => e.default);
const extraCardList = Object.values(extraModules).map((e) => e.default);
const trapCardList = Object.values(trapModules).map((e) => e.default);
const tokenCardList = Object.values(tokenModules).map((e) => e.default);

const allCardListMap = [monsterCardList, extraCardList, magicCardList, trapCardList, tokenCardList]
    .flat()
    .reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {});

const DECK_CONFIG = {
    deck_name: "エグゾディアデッキ",
    main_deck: [
        // Monsters
        { card_name: "封印されしエクゾディア", quantity: 1 },
        { card_name: "封印されし者の右腕", quantity: 1 },
        { card_name: "封印されし者の左腕", quantity: 1 },
        { card_name: "封印されし者の右足", quantity: 1 },
        { card_name: "封印されし者の左足", quantity: 1 },
        { card_name: "ジェネクス・コントローラー", quantity: 2 },
        { card_name: "大砲だるま", quantity: 2 },
        { card_name: "神聖なる魂", quantity: 1 },
        { card_name: "クリッター", quantity: 1 },
        { card_name: "宣告者の神巫", quantity: 3 },
        { card_name: "竜輝巧－エルγ", quantity: 3 },
        { card_name: "竜輝巧－アルζ", quantity: 3 },
        { card_name: "竜輝巧－バンα", quantity: 3 },
        { card_name: "サイバー・エンジェル－弁天－", quantity: 3 },
        { card_name: "サイバー・エンジェル－韋駄天－", quantity: 1 },

        // Spells
        { card_name: "ワン・フォー・ワン", quantity: 1 },
        { card_name: "おろかな埋葬", quantity: 1 },
        { card_name: "ジャック・イン・ザ・ハンド", quantity: 3 },
        { card_name: "エマージェンシー・サイバー", quantity: 3 },
        { card_name: "極超の竜輝巧", quantity: 3 },
        { card_name: "竜輝巧－ファフニール", quantity: 3 },
        { card_name: "テラ・フォーミング", quantity: 1 },
        { card_name: "チキンレース", quantity: 1 },
        { card_name: "盆回し", quantity: 1 },
        { card_name: "金満で謙虚な壺", quantity: 3 },
        { card_name: "流星輝巧群", quantity: 1 },
        { card_name: "高等儀式術", quantity: 1 },
        { card_name: "儀式の準備", quantity: 3 },
        // Traps
        { card_name: "補充要員", quantity: 3 },
    ],
    extra_deck: [
        { card_name: "虹光の宣告者", quantity: 1 },
        { card_name: "セイクリッド・トレミスM7", quantity: 1 },
        { card_name: "永遠の淑女 ベアトリーチェ", quantity: 2 },
        { card_name: "竜輝巧－ファフμβ'", quantity: 2 },
        { card_name: "幻獣機アウローラドン", quantity: 1 },
        { card_name: "警衛バリケイドベルグ", quantity: 1 },
        { card_name: "ユニオン・キャリアー", quantity: 1 },
        { card_name: "転生炎獣アルミラージ", quantity: 1 },
        { card_name: "リンクリボー", quantity: 1 },
        { card_name: "天霆號アーゼウス", quantity: 1 },
        { card_name: "FNo.0 未来皇ホープ", quantity: 1 },
        { card_name: "FNo.0 未来龍皇ホープ", quantity: 1 },
        { card_name: "旧神ヌトス", quantity: 1 },
    ],
    token: [{ card_name: "幻獣機トークン", quantity: 1 }],
};
export const DECK = {
    deck_name: DECK_CONFIG.deck_name,
    main_deck: expandDeckList(DECK_CONFIG.main_deck, allCardListMap),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck, allCardListMap),
    token: expandDeckList(DECK_CONFIG.token, allCardListMap),
};
