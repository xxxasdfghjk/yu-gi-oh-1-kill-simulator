import type { XyzMonsterCard } from "@/types/card";
import { isXyzMonster } from "@/utils/cardManagement";

export default {
    card_name: "FNo.0 未来皇ホープ",
    card_type: "モンスター" as const,
    monster_type: "エクシーズモンスター" as const,
    rank: 1,
    element: "光" as const,
    race: "戦士" as const,
    attack: 0,
    defense: 0,
    filterAvailableMaterials: (e) => isXyzMonster(e.card),
    materialCondition: (cardList) => {
        return (
            cardList.length === 2 &&
            isXyzMonster(cardList[0].card) &&
            isXyzMonster(cardList[1].card) &&
            cardList[0].card.rank === cardList[1].card.rank &&
            !cardList.find((e) => e.card.card_name.startsWith("No."))
        );
    },
    text: "「No.」モンスター以外の同じランクのXモンスター×２\nルール上、このカードのランクは１として扱う。\n①：このカードは戦闘では破壊されず、このカードの戦闘で発生するお互いの戦闘ダメージは０になる。\n②：このカードが相手モンスターと戦闘を行ったダメージステップ終了時に発動できる。その相手モンスターのコントロールをバトルフェイズ終了時まで得る。\n③：フィールドのこのカードが効果で破壊される場合、代わりにこのカードのX素材を１つ取り除く事ができる。",
    image: "card100178133_1.jpg",
    hasDefense: true as const,
    hasLevel: false as const,
    hasLink: false as const,
    hasRank: true as const,
    canNormalSummon: false,
    effect: {},
} satisfies XyzMonsterCard;
