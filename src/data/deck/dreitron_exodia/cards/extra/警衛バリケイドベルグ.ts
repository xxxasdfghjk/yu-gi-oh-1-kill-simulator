import type { CardInstance } from "@/types/card";
import { sumLink } from "@/utils/cardManagement";

export default {
    card_name: "警衛バリケイドベルグ",
    card_type: "モンスター" as const,
    monster_type: "リンクモンスター" as const,
    link: 2,
    linkDirection: ["左", "下"] as const,
    element: "闇" as const,
    race: "機械" as const,
    attack: 1000,
    filterAvailableMaterials: () => true,
    materialCondition: (card: CardInstance[]) => {
        const uniqueNames = new Set(card.map((c) => c.card.card_name));
        return card.length === 2 && uniqueNames.size === 2 && sumLink(card) === 2;
    },
    text: "このカード名の①の効果は１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合、手札を１枚捨てて発動できる。このターンのエンドフェイズに、自分の墓地から永続魔法カードまたはフィールド魔法カード１枚を選んで手札に加える。②：このカードがモンスターゾーンに存在する限り、自分フィールドの表側表示の魔法カードは相手の効果では破壊されない。",
    image: "card100322913_1.jpg",
    hasDefense: false as const,
    hasLevel: false as const,
    hasLink: true as const,
    hasRank: false as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: () => {
                // このゲーム内では基本的に使用しない
                return false;
            },
            effect: () => {
                // 効果なし
            },
        },
    },
};
