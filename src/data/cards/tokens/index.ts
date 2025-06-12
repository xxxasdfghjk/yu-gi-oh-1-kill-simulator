import type { CommonMonster } from "@/types/card";

export const TOKEN = [
    {
        card_name: "幻獣機トークン",
        monster_type: "通常モンスター",
        level: 3,
        element: "風",
        race: "機械",
        attack: 0,
        defense: 0,
        text: "このカードは「幻獣機トークン」として使用する事ができる。",
        image: "token.jpg",
        canNormalSummon: false,
        card_type: "モンスター",
        effect: {},
        hasDefense: true,
        hasLevel: true,
        hasLink: false,
        hasRank: false,
    },
] as const satisfies CommonMonster[];
