import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { sendCard } from "@/utils/cardMovement";
import { withTurnAtOneceEffect, withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "クリッター",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 3,
    element: "闇" as const,
    race: "悪魔" as const,
    attack: 1000,
    defense: 600,
    text: "このカード名の効果は１ターンに１度しか使用できない。(1)：このカードがフィールドから墓地へ送られた場合に発動する。デッキから攻撃力１５００以下のモンスター１体を手札に加える。このターン、自分はこの効果で手札に加えたカード及びその同名カードの効果を発動できない。",
    image: "card100350408_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true,
    effect: {
        onFieldToGraveyard: (state: GameStore, card: CardInstance) =>
            withTurnAtOneceEffect(state, card, (state, card) => {
                const targets = (state: GameStore) =>
                    state.deck.filter((c) => monsterFilter(c.card) && c.card.attack <= 1500);

                if (targets(state).length === 0) {
                    return;
                }

                withUserSelectCard(
                    state,
                    card,
                    targets,
                    {
                        select: "single",
                        order: 999,
                        message: "手札に加える攻撃力1500以下のモンスターを選択してください",
                    },
                    (state, _, selected) => {
                        sendCard(state, selected[0], "Hand");
                    }
                );
            }),
    },
};
