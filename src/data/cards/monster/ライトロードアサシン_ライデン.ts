import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "ライトロード・アサシン ライデン",
    card_type: "モンスター" as const,
    text: "自分のメインフェイズ時に発動できる。 自分のデッキの上からカードを２枚墓地へ送る。 この効果で墓地へ送ったカードの中に「ライトロード」と名のついたモンスターがあった場合、このカードの攻撃力は相手のエンドフェイズ時まで２００ポイントアップする。 「ライトロード・アサシン ライデン」のこの効果は１ターンに１度しか使用できない。 また、自分のエンドフェイズ毎に発動する。 自分のデッキの上からカードを２枚墓地へ送る。",
    image: "card100161030_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "戦士" as const,
    attack: 1700,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    hasTuner: true as const,
    effect: {},
} satisfies LeveledMonsterCard;
