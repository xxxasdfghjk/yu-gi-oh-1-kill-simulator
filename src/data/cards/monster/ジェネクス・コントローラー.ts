import type { CommonMonster } from "@/types/card";

const card = {
    card_name: "ジェネクス・コントローラー",
    card_type: "モンスター" as const,
    monster_type: "通常モンスター" as const,
    level: 3,
    element: "闇" as const,
    race: "機械" as const,
    attack: 1400,
    defense: 1200,
    text: "仲間達と心を通わせる事ができる、数少ないジェネクスのひとり。様々なエレメントの力をコントロールできるぞ。",
    image: "card100004619_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {},
    hasTuner: true,
} satisfies CommonMonster;

export default card;