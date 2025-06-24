import { CardSelector } from "@/utils/CardSelector";
import {
    withOption,
    withSendToGraveyardFromDeckTop,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSelectCard,
    withUserSummon,
} from "@/utils/effectUtils";
import type { LeveledMonsterCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "ティアラメンツ・クシャトリラ",
    card_type: "モンスター" as const,
    text: "このカード名の①②③の効果はそれぞれ１ターンに１度しか使用できない。①：自分・相手のメインフェイズに発動できる。このカードを手札から特殊召喚し、自分の手札・墓地から「クシャトリラ」カードまたは「ティアラメンツ」カード１枚を選んで除外する。②：このカードが召喚・特殊召喚に成功した場合に発動できる。自分または相手のデッキの上からカードを３枚墓地へ送る。③：このカードが効果で墓地へ送られた場合に発動できる。自分のデッキの上からカードを２枚墓地へ送る。",
    image: "card100279923_1.jpg",
    monster_type: "効果モンスター",
    level: 7,
    element: "水" as const,
    race: "サイキック" as const,
    attack: 2300,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onAnywhereToGraveyardByEffect: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "kushatorila_1")) {
                return;
            }
            withOption(
                state,
                card,
                [
                    {
                        name: "デッキの上から2枚を墓地へ送る",
                        condition: (state) => {
                            return new CardSelector(state).deck().len() >= 2;
                        },
                    },
                ],
                (state, card) => {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            withSendToGraveyardFromDeckTop(state, card, 2, () => {}, { byEffect: true });
                        },
                        "kushatorila_1"
                    );
                },
                true
            );
        },
        onSummon: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "kushatorila_2")) {
                return;
            }
            withOption(
                state,
                card,
                [
                    {
                        name: "自分のデッキの上から3枚カードを墓地に送る",
                        condition: (state) => new CardSelector(state).deck().len() >= 3,
                    },
                ],
                (state, card, option) => {
                    if (option === "自分のデッキの上から3枚カードを墓地に送る") {
                        withTurnAtOneceEffect(
                            state,
                            card,
                            (state, card) => {
                                withSendToGraveyardFromDeckTop(state, card, 3, () => {});
                            },
                            "kushatorila_2"
                        );
                    }
                },
                true
            );
        },
        onIgnition: {
            condition: (state, card) => {
                return (
                    card.location === "Hand" &&
                    new CardSelector(state)
                        .hand()
                        .graveyard()
                        .filter()
                        .excludeId(card.id)
                        .include("ティアラメンツ")
                        .len() > 0 &&
                    hasEmptyMonsterZone(state)
                );
            },
            effect: (state, card) => {
                if (!withTurnAtOneceCondition(state, card, () => true, "kushatorila_3")) {
                    return;
                }
                withUserSummon(state, card, card, {}, (state, card) => {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            withUserSelectCard(
                                state,
                                card,
                                (state) => {
                                    return new CardSelector(state)
                                        .hand()
                                        .graveyard()
                                        .filter()
                                        .include("ティアラメンツ")
                                        .get();
                                },
                                { select: "single" },
                                (state, _card, selected) => {
                                    sendCard(state, selected[0], "Exclusion");
                                }
                            );
                        },
                        "kushatorila_3"
                    );
                });
            },
        },
    },
} satisfies LeveledMonsterCard;
