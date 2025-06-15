import type { CommonMonster } from "@/types/card";

const card = {
    card_name: "封印されし者の右腕",
    card_type: "モンスター" as const,
    monster_type: "通常モンスター" as const,
    level: 1,
    element: "闇" as const,
    race: "魔法使い" as const,
    attack: 200,
    defense: 300,
    text: "封印されしエクゾディアの右腕。封印されているため、その力は計り知れない。",
    image: "card100220676_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {},
} satisfies CommonMonster;

export default card;