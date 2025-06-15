import type { XyzMonsterCard } from "@/types/card";
import { isXyzMonster } from "@/utils/cardManagement";

export default {
    card_name: "FNo.0 未来龍皇ホープ",
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
            cardList.length === 3 &&
            isXyzMonster(cardList[0].card) &&
            isXyzMonster(cardList[1].card) &&
            isXyzMonster(cardList[2].card) &&
            cardList[0].card.rank === cardList[1].card.rank &&
            cardList[1].card.rank === cardList[2].card.rank &&
            !cardList.find((e) => e.card.card_name.startsWith("No."))
        );
    },
    text: "「No.」モンスター以外の同じランクのXモンスター×３\nルール上、このカードのランクは１として扱い、このカード名は「未来皇ホープ」カードとしても扱う。\nこのカードは自分フィールドの「FNo.0 未来皇ホープ」の上に重ねてX召喚する事もできる。\n①：このカードは戦闘・効果では破壊されない。\n②：１ターンに１度、相手がモンスターの効果を発動した時、このカードのX素材を１つ取り除いて発動できる。その発動を無効にする。この効果でフィールドのモンスターの効果の発動を無効にした場合、さらにそのコントロールを得る。",
    image: "card100323225_1.jpg",
    hasDefense: true as const,
    hasLevel: false as const,
    hasLink: false as const,
    hasRank: true as const,
    canNormalSummon: false,
    effect: {},
} satisfies XyzMonsterCard;
