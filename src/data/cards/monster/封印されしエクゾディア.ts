import type { CommonMonster } from "@/types/card";

const card = {
    card_name: "封印されしエクゾディア",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 3,
    element: "闇" as const,
    race: "魔法使い" as const,
    attack: 1000,
    defense: 1000,
    text: "このカードと「封印されし者の右腕」「封印されし者の左腕」「封印されし者の右足」「封印されし者の左足」が手札に全て揃った時、自分はデュエルに勝利する。",
    image: "card100224614_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {},
} satisfies CommonMonster;

export default card;