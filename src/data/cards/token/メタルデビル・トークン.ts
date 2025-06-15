import type { CommonMonster } from "@/types/card";

const card = {
    card_name: "メタルデビル・トークン",
    monster_type: "通常モンスター",
    level: 1,
    element: "闇",
    race: "悪魔",
    attack: 0,
    defense: 0,
    text: "このカードは「メタルデビル・トークン」として使用する事ができる。",
    image: "619FYKr61VL._AC_.jpg",
    canNormalSummon: false,
    card_type: "モンスター",
    effect: {},
    hasDefense: true,
    hasLevel: true,
    hasLink: false,
    hasRank: false,
} satisfies CommonMonster;

export default card;
