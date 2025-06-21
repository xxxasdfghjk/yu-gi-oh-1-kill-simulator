import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "オベリスクの巨神兵",
    card_type: "モンスター" as const,
    text: "このカードを通常召喚する場合、自分フィールド上に存在するモンスター３体をリリースしてアドバンス召喚しなければならない。このカードがフィールド上に表側表示で存在する限り、このカードを魔法・罠・モンスターの効果の対象にする事はできない。自分フィールド上に存在するモンスター２体をリリースする事で、相手フィールド上に存在するモンスターを全て破壊する。特殊召喚されたこのカードは、エンドフェイズ時に墓地へ送られる。",
    image: "card100018655_1.jpg",
    monster_type: "効果モンスター",
    element: "神" as const,
    race: "幻神獣" as const,
    attack: 4000,
    defense: 4000,
    level: 10,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        // デッキと関係ないため未実装
    },
} satisfies LeveledMonsterCard;
