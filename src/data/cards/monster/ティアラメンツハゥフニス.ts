import { withUserSummon, withDelayRecursive, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ティアラメンツ・ハゥフニス",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。 ①：相手がフィールドのモンスターの効果を発動した時に発動できる。 このカードを手札から特殊召喚し、自分のデッキの上からカードを３枚墓地へ送る。 ②：このカードが効果で墓地へ送られた場合に発動できる。 融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で持ち主のデッキの下に戻し、その融合モンスター１体をＥＸデッキから融合召喚する。",
    image: "card100260474_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "闇" as const,
    race: "水族" as const,
    attack: 1600,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(state, card, (state, card) => {
                    return card.location === "Hand";
                }, "TearlamentHaufenis_HandEffect");
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    // 手札から特殊召喚
                    withUserSummon(
                        state,
                        card,
                        card,
                        {
                            canSelectPosition: true,
                            optionPosition: ["attack", "defense"]
                        },
                        (state, card) => {
                            // デッキの上から3枚墓地に送る
                            withDelayRecursive(
                                state,
                                card,
                                { delay: 100 },
                                3,
                                (state, card, depth) => {
                                    if (state.deck.length > 0) {
                                        sendCard(state, state.deck[0], "Graveyard");
                                    }
                                }
                            );
                        }
                    );
                }, "TearlamentHaufenis_HandEffect");
            }
        },
        onAnywhereToGraveyard: (state, card) => {
            // 効果で墓地に送られた場合の融合召喚効果（簡略化：デッキの上から3枚墓地に送るのみ）
            withDelayRecursive(
                state,
                card,
                { delay: 100 },
                3,
                (state, card, depth) => {
                    if (state.deck.length > 0) {
                        sendCard(state, state.deck[0], "Graveyard");
                    }
                }
            );
        }
    },
};
