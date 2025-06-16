import type { LeveledMonsterCard } from "@/types/card";
import { withDraw } from "@/utils/effectUtils";

export default {
    card_name: "D-HERO ディスクガイ",
    card_type: "モンスター" as const,
    text: "このカードが墓地からの特殊召喚に成功した時、自分のデッキからカードを２枚ドローする。",
    image: "card100019873_1.jpg",
    monster_type: "効果モンスター",
    level: 1,
    element: "闇" as const,
    race: "戦士" as const,
    attack: 300,
    defense: 300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onGraveyardToField: (state, card) => {
            withDraw(state, card, { count: 2 });
        },
    },
} satisfies LeveledMonsterCard;
