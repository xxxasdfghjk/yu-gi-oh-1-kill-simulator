import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "ラーの翼神竜",
    card_type: "モンスター" as const,
    text: "このカードは特殊召喚できない。このカードを通常召喚する場合、３体をリリースして召喚しなければならない。①：このカードの召喚は無効化されない。②：このカードの召喚成功時には、このカード以外の魔法・罠・モンスターの効果は発動できない。③：このカードが召喚に成功した時、１００LPになるようにLPを払って発動できる。このカードの攻撃力・守備力は払った数値分アップする。④：１０００LPを払い、フィールドのモンスター１体を対象として発動できる。そのモンスターを破壊する。",
    image: "card100019991_1.jpg",
    monster_type: "効果モンスター",
    element: "神" as const,
    race: "幻神獣" as const,
    attack: 0,
    defense: 0,
    level: 10,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {},
} satisfies LeveledMonsterCard;
