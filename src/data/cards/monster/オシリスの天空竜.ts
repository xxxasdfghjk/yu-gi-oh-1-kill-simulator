import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "オシリスの天空竜",
    card_type: "モンスター" as const,
    text: "このカードを通常召喚する場合、自分フィールド上のモンスター３体をリリースして召喚しなければならない。このカードの召喚は無効化されない。このカードが召喚に成功した時、魔法・罠・効果モンスターの効果は発動できない。このカードは特殊召喚した場合エンドフェイズ時に墓地へ送られる。このカードの攻撃力・守備力は自分の手札の数×１０００ポイントアップする。相手モンスターが攻撃表示で召喚・特殊召喚された時、そのモンスターの攻撃力を２０００ポイントダウンさせ、攻撃力が０になった場合そのモンスターを破壊する。",
    image: "card100019985_1.jpg",
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
