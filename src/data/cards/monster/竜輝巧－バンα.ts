import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { releaseCard, sendCard } from "@/utils/cardMovement";
import { draitronIgnitionCondition, getDraitronReleaseTargets } from "@/utils/draitronUtils";
import { withTurnAtOneceEffect, withUserSelectCard, withUserSummon } from "@/utils/effectUtils";

export default {
    card_name: "竜輝巧－バンα",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 1,
    element: "光" as const,
    race: "機械" as const,
    attack: 2000,
    defense: 0,
    text: "このカードは通常召喚できず、「ドライトロン」カードの効果でのみ特殊召喚できる。このカード名の効果は1ターンに1度しか使用できない。①：このカード以外の自分の手札・フィールドの、「ドライトロン」モンスターか儀式モンスター1体をリリースして発動できる（この効果を発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない）。このカードを手札・墓地から守備表示で特殊召喚する。その後、デッキから儀式モンスター1枚を手札に加えることができる。",
    image: "card100206504_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: (gameState: GameStore, cardInstance: CardInstance) => {
                return draitronIgnitionCondition("竜輝巧－バンα")(gameState, cardInstance);
            },
            effect: (state: GameStore, cardInstance: CardInstance) =>
                withTurnAtOneceEffect(state, cardInstance, (state, cardInstance) => {
                    withUserSelectCard(
                        state,
                        cardInstance,
                        getDraitronReleaseTargets("竜輝巧－バンα"),
                        { select: "single", message: "リリースするモンスターを選択してください" },
                        (state, cardInstance, selected) => {
                            const targetCard = selected[0];
                            releaseCard(state, targetCard);

                            withUserSummon(
                                state,
                                cardInstance,
                                cardInstance,
                                { canSelectPosition: false, optionPosition: ["defense"] },
                                (state, cardInstance) => {
                                    const target = (state: GameStore) =>
                                        state.deck.filter(
                                            (card) =>
                                                monsterFilter(card.card) && card.card.monster_type === "儀式モンスター"
                                        );

                                    if (target(state).length > 0) {
                                        withUserSelectCard(
                                            state,
                                            cardInstance,
                                            target,
                                            {
                                                select: "single",
                                                message: "手札に加える儀式モンスターを選択してください",
                                            },
                                            (state, _, target) => {
                                                sendCard(state, target[0], "Hand");
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    );
                }),
        },
    },
};
