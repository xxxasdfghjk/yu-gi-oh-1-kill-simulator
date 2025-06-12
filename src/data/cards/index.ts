// Re-export all card definitions from their new organized locations
export { COMMON_MONSTERS, CommonMonsterMap } from "./monsters/common";
export { EXTRA_MONSTERS, ExtraMonsterMap } from "./monsters/extra";
export { MAGIC_CARDS } from "./spells";
export { TRAP_CARDS, TrapCardMap } from "./traps";
export { TOKEN } from "./tokens";

import { COMMON_MONSTERS, CommonMonsterMap } from "./monsters/common";
import { EXTRA_MONSTERS, ExtraMonsterMap } from "./monsters/extra";
import { MAGIC_CARDS } from "./spells";
import { TRAP_CARDS, TrapCardMap } from "./traps";
import { TOKEN } from "./tokens";
import type { Card } from "@/types/card";

// Create maps for easy lookup
const MagicCardMap = MAGIC_CARDS.reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {}) as Record<
    (typeof MAGIC_CARDS)[number]["card_name"],
    (typeof MAGIC_CARDS)[number]
>;

const TokenMap = TOKEN.reduce((prev, cur) => ({ ...prev, [cur.card_name]: cur }), {}) as Record<
    (typeof TOKEN)[number]["card_name"],
    (typeof TOKEN)[number]
>;

// All available cards
const AllCards = {
    ...CommonMonsterMap,
    ...ExtraMonsterMap,
    ...MagicCardMap,
    ...TrapCardMap,
    ...TokenMap,
};

// Deck configuration based on cards.json
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
    ] satisfies {
        card_name:
            | (typeof MAGIC_CARDS)[number]["card_name"]
            | (typeof COMMON_MONSTERS)[number]["card_name"]
            | (typeof TRAP_CARDS)[number]["card_name"];
        quantity: number;
    }[],
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
    ] satisfies {
        card_name: (typeof EXTRA_MONSTERS)[number]["card_name"];
        quantity: number;
    }[],
    token: [{ card_name: "幻獣機トークン", quantity: 1 }] satisfies {
        card_name: (typeof TOKEN)[number]["card_name"];
        quantity: number;
    }[],
} as const;
type CardName =
    | (typeof MAGIC_CARDS)[number]["card_name"]
    | (typeof COMMON_MONSTERS)[number]["card_name"]
    | (typeof TRAP_CARDS)[number]["card_name"]
    | (typeof EXTRA_MONSTERS)[number]["card_name"]
    | (typeof TOKEN)[number]["card_name"];
// Helper function to expand deck list
const expandDeckList = (deckList: { card_name: CardName; quantity: number }[]): Card[] => {
    const result: Card[] = [];

    for (const entry of deckList) {
        const card = AllCards[entry.card_name];
        if (!card) {
            continue;
        }

        // Add the card multiple times based on quantity
        for (let i = 0; i < entry.quantity; i++) {
            result.push(card);
        }
    }

    return result;
};

// Export the expanded deck - overriding the simple DECK defined above
export const DECK = {
    deck_name: DECK_CONFIG.deck_name,
    main_deck: expandDeckList(DECK_CONFIG.main_deck),
    extra_deck: expandDeckList(DECK_CONFIG.extra_deck),
    token: expandDeckList(DECK_CONFIG.token),
};

// Export deck configuration for reference
export const DECK_CONFIGURATION = DECK_CONFIG;

// Export the maps for external use
export { MagicCardMap, TokenMap, AllCards };
