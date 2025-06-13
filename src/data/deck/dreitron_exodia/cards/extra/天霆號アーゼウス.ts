import type { CardInstance, XyzMonsterCard } from "@/types/card";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";
import { getLevel } from "@/utils/gameUtils";

export default {
    card_name: "天霆號アーゼウス",
    card_type: "モンスター" as const,
    monster_type: "エクシーズモンスター" as const,
    rank: 12,
    element: "光" as const,
    race: "機械" as const,
    attack: 3000,
    defense: 3000,
    filterAvailableMaterials: (e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 12,
    materialCondition: (card: CardInstance[]) => {
        return !!(card.length === 2 && card.every((e) => hasLevelMonsterFilter(e.card) && getLevel(e) === 12));
    },
    text: "レベル１２モンスター×２\n「天霆號アーゼウス」は、Xモンスターが戦闘を行ったターンに１度、自分フィールドのXモンスターの上に重ねてX召喚する事もできる。\n①：自分・相手ターンに、このカードのX素材を２つ取り除いて発動できる。フィールドの他のカードを全て墓地へ送る。\n②：１ターンに１度、自分フィールドの他のカードが戦闘または相手の効果で破壊された場合に発動できる。手札・デッキ・EXデッキからカード１枚をこのカードのX素材にする。",
    image: "card100336782_1.jpg",
    hasDefense: true as const,
    hasLevel: false as const,
    hasLink: false as const,
    hasRank: true as const,
    canNormalSummon: false,
    effect: {},
} satisfies XyzMonsterCard;
