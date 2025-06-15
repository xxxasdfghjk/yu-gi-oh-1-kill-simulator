import type { CommonMonster } from "@/types/card";

const card = {
    card_name: "大砲だるま",
    card_type: "モンスター" as const,
    monster_type: "通常モンスター" as const,
    level: 2,
    element: "闇" as const,
    race: "機械" as const,
    attack: 900,
    defense: 500,
    text: "大砲で埋め尽くされているメカだるま。ねらいは外さない。",
    image: "card100224572_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {},
} satisfies CommonMonster;

export default card;