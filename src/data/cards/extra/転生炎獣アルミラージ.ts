import type { ExtraMonster } from "@/types/card";
import { sumLink, monsterFilter } from "@/utils/cardManagement";
import { getAttack } from "@/utils/gameUtils";
import type { CardInstance } from "@/types/card";

const card = {
    card_name: "転生炎獣アルミラージ",
    card_type: "モンスター" as const,
    monster_type: "リンクモンスター" as const,
    link: 1,
    linkDirection: ["右下"] as const,
    element: "炎" as const,
    race: "サイバース" as const,
    attack: 0,
    filterAvailableMaterials: (card) =>
        card.summonedBy === "Normal" && monsterFilter(card.card) && getAttack(card) <= 1000,
    materialCondition: (card: CardInstance[]) => {
        return card.length === 1 && sumLink(card) === 1 && card[0].summonedBy === "Normal";
    },
    text: "通常召喚された攻撃力1000以下のモンスター1体\nこのカード名の②の効果は１ターンに１度しか使用できない。①：このカードをリリースし、自分フィールドのモンスター１体を対象として発動できる。このターン、そのモンスターは相手の効果では破壊されない。この効果は相手ターンでも発動できる。②：このカードが墓地に存在し、通常召喚された自分のモンスターが戦闘で破壊された時に発動できる。このカードを特殊召喚する。",
    image: "card100354764_1.jpg",
    hasDefense: false as const,
    hasLevel: false as const,
    hasLink: true as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {},
} satisfies ExtraMonster;

export default card;