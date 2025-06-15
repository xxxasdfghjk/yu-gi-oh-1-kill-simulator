import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { releaseCard } from "@/utils/cardMovement";
import { draitronIgnitionCondition, getDraitronReleaseTargets } from "@/utils/draitronUtils";
import { withTurnAtOneceEffect, withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "竜輝巧－エルγ",
    card_type: "モンスター" as const,
    monster_type: "効果モンスター" as const,
    level: 1,
    element: "光" as const,
    race: "機械" as const,
    attack: 2000,
    defense: 0,
    text: "このカードは通常召喚できず、「ドライトロン」カードの効果でのみ特殊召喚できる。このカード名の効果は1ターンに1度しか使用できない。①：自分の手札・フィールドから、このカード以外の「ドライトロン」モンスターまたは儀式モンスター1体をリリースして発動できる。このカードを手札・墓地から守備表示で特殊召喚する。その後、自分の墓地から「竜輝巧－エルγ」以外の攻撃力2000の「ドライトロン」モンスター1体を選んで特殊召喚できる。この効果を発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない。",
    image: "card100206513_1.jpg",
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false,
    effect: {
        onIgnition: {
            condition: (state: GameStore, cardInstance: CardInstance) => {
                return draitronIgnitionCondition("竜輝巧－エルγ")(state, cardInstance);
            },
            effect: (state: GameStore, cardInstance: CardInstance) =>
                withTurnAtOneceEffect(state, cardInstance, (state, cardInstance) => {
                    withUserSelectCard(
                        state,
                        cardInstance,
                        getDraitronReleaseTargets("竜輝巧－エルγ"),
                        { select: "single", message: "リリースするモンスターを選択してください" },
                        (state, card, selected) => {
                            // Release selected card and summon this card
                            const targetCard = selected[0];
                            releaseCard(state, targetCard);

                            // Remove this card from hand or graveyard and summon it
                            withUserSummon(
                                state,
                                card,
                                card,
                                { canSelectPosition: false, optionPosition: ["defense"] },
                                (state, cardInstance) => {
                                    // Search for a Draitron monster
                                    const draitronMonsters = state.graveyard.filter(
                                        (card) =>
                                            monsterFilter(card.card) &&
                                            card.card.card_name.includes("竜輝巧") &&
                                            card.card.attack === 2000
                                    );
                                    if (draitronMonsters.length === 0) {
                                        return;
                                    }
                                    if (!hasEmptyMonsterZone(state)) {
                                        return;
                                    }
                                    withUserSelectCard(
                                        state,
                                        cardInstance,
                                        (state: GameStore) => {
                                            return state.graveyard.filter(
                                                (card) =>
                                                    monsterFilter(card.card) &&
                                                    card.card.card_name.includes("竜輝巧") &&
                                                    card.card.attack === 2000
                                            );
                                        },
                                        {
                                            select: "single",
                                            message: "墓地から特殊召喚するドライトロンモンスターを選択してください",
                                        },
                                        (state, cardInstance, selected) => {
                                            const targetCard = selected[0];
                                            withUserSummon(
                                                state,
                                                cardInstance,
                                                targetCard,
                                                { canSelectPosition: false, optionPosition: ["defense"] },
                                                () => {}
                                            );
                                        }
                                    );
                                }
                            );
                        }
                    );
                }),
        },
    },
};
