import type { FusionMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";

export default {
    card_name: "沼地のドロゴン",
    card_type: "モンスター" as const,
    text: "同じ属性で種族が異なるモンスター×２\n①：このカードがモンスターゾーンに存在する限り、相手はこのカード及びこのカードと同じ属性を持つフィールドのモンスターを効果の対象にできない。 ②：１ターンに１度、属性を１つ宣言して発動できる。 このカードはターン終了時まで宣言した属性になる。この効果は相手ターンでも発動できる。",
    image: "card100099272_1.jpg",
    monster_type: "融合モンスター",
    level: 4,
    element: "水" as const,
    race: "幻竜" as const,
    attack: 1900,
    defense: 1600,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    materialCondition: (card) => {
        if (card.length !== 2) {
            return false;
        }
        const elementNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.element, e.card.element]) || ["", ""])).values()
        ).length;
        const raceNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.race, e.card.race]) || ["", ""])).values()
        ).length;
        return elementNum === 1 && raceNum === 2;
    },
    filterAvailableMaterials: () => true,
    effect: {},
} satisfies FusionMonsterCard;
