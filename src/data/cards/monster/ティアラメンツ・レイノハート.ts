import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";

export default {
    card_name: "ティアラメンツ・レイノハート",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードが手札・デッキから墓地へ送られた場合、または召喚・特殊召喚に成功した場合に発動できる。自分のデッキから「ティアラメンツ」魔法・罠カード１枚を手札に加える。②：このカードが効果で墓地へ送られた場合に発動できる。融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で除外し、その融合モンスター１体をＥＸデッキから融合召喚する。",
    image: "card100260417_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "水" as const,
    race: "戦士" as const,
    attack: 1500,
    defense: 2100,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onSummon: (state, card) => {
            withTurnAtOneceEffect(
                state,
                card,
                (state, card) => {
                    const tearlamentSpellTrapsInDeck = new CardSelector(state)
                        .deck()
                        .get()
                        .filter(
                            (c) =>
                                c.card.card_name.includes("ティアラメンツ") &&
                                (c.card.card_type === "魔法" || c.card.card_type === "罠")
                        );

                    if (tearlamentSpellTrapsInDeck.length > 0) {
                        withUserSelectCard(
                            state,
                            card,
                            () => tearlamentSpellTrapsInDeck,
                            {
                                select: "single",
                                message: "手札に加える「ティアラメンツ」魔法・罠カードを選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Hand");
                                }
                            }
                        );
                    }
                },
                "TearlamentReinoheart_Search"
            );
        },
        onAnywhereToGraveyard: (state, card) => {
            withTurnAtOneceEffect(
                state,
                card,
                (state, card) => {
                    const tearlamentSpellTrapsInDeck = new CardSelector(state)
                        .deck()
                        .get()
                        .filter(
                            (c) =>
                                c.card.card_name.includes("ティアラメンツ") &&
                                (c.card.card_type === "魔法" || c.card.card_type === "罠")
                        );

                    if (tearlamentSpellTrapsInDeck.length > 0) {
                        withUserSelectCard(
                            state,
                            card,
                            () => tearlamentSpellTrapsInDeck,
                            {
                                select: "single",
                                message: "手札に加える「ティアラメンツ」魔法・罠カードを選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Hand");
                                }
                            }
                        );
                    }
                },
                "TearlamentReinoheart_Search"
            );
        },
        onFieldToGraveyard: (state, card) => {
            // 効果で墓地に送られた場合の融合召喚効果（簡略化：デッキの上から3枚墓地に送るのみ）
            // TODO
            withDelayRecursive(state, card, { delay: 100 }, 3, (state, card, depth) => {
                if (state.deck.length > 0) {
                    sendCard(state, state.deck[0], "Graveyard");
                }
            });
        },
    },
} satisfies LeveledMonsterCard;
