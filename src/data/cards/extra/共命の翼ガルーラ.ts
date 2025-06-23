import { withDraw, withOption, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { monsterFilter } from "@/utils/cardManagement";
import type { FusionMonsterCard, MonsterCard } from "@/types/card";

export default {
    card_name: "共命の翼ガルーラ",
    card_type: "モンスター" as const,
    text: "同じ種族・属性でカード名が異なるモンスター×２ このカード名の②の効果は１ターンに１度しか使用できない。 ①：このカードの戦闘で発生する相手への戦闘ダメージは倍になる。 ②：このカードが墓地へ送られた場合に発動できる。 自分は１枚ドローする。",
    image: "card100336764_1.jpg",
    monster_type: "融合モンスター",
    level: 6,
    element: "闇" as const,
    race: "鳥獣" as const,
    attack: 1500,
    defense: 2400,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onAnywhereToGraveyard: (state, card) => {
            withOption(
                state,
                card,
                [{ name: "自分は１枚ドローする", condition: () => true }],
                (state, card) => {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            // 1枚ドロー
                            withDraw(state, card, { count: 1 });
                        },
                        "Garura_ToGraveyard"
                    );
                },
                true
            );
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card);
    },
    materialCondition: (cards) => {
        if (cards.length !== 2) return false;

        // 全てモンスターであることを確認
        if (!cards.every((c) => monsterFilter(c.card))) return false;

        // 同じ種族・属性であることを確認
        const firstCard = cards[0].card as MonsterCard;
        const race = firstCard.race;
        const element = firstCard.element;

        const sameRaceAndElement = cards.every((c) => {
            const monster = c.card as MonsterCard;
            return monster.race === race && monster.element === element;
        });

        // カード名が異なることを確認
        const differentNames = new Set(cards.map((c) => c.card.card_name)).size === 2;

        return sameRaceAndElement && differentNames;
    },
} satisfies FusionMonsterCard;
