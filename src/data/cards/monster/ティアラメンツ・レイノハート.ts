import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withOption,
    withUserSummon,
    withTurnAtOneceEffect,
    withTurnAtOneceCondition,
} from "@/utils/effectUtils";
import { sendCardToGraveyardByEffect } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "ティアラメンツ・レイノハート",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードが召喚・特殊召喚に成功した場合に発動できる。デッキから「ティアラメンツ・レイノハート」以外の「ティアラメンツ」モンスター１体を墓地へ送る。②：このカードが効果で墓地へ送られた場合に発動できる。このカードを特殊召喚し、自分の手札から「ティアラメンツ」カード１枚を選んで墓地へ送る。この効果で特殊召喚したこのカードは、フィールドから離れた場合に除外される。",
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
            if (!withTurnAtOneceCondition(state, card, () => true, "laynoheart_1")) {
                return;
            }
            withOption(
                state,
                card,
                [
                    {
                        name: "デッキから「ティアラメンツ・レイノハート」以外の「ティアラメンツ」モンスター１体を墓地へ送る。",
                        condition: (state) =>
                            new CardSelector(state)
                                .deck()
                                .filter()
                                .monster()
                                .include("ティアラメンツ")
                                .exclude("ティアラメツ・レイノハート")
                                .len() > 0,
                    },
                ],
                (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            new CardSelector(state)
                                .deck()
                                .filter()
                                .monster()
                                .include("ティアラメンツ")
                                .exclude("ティアラメツ・レイノハート")
                                .get(),
                        { select: "single" },
                        (state, card, selected) => {
                            const id = selected[0].id;
                            withTurnAtOneceEffect(
                                state,
                                card,
                                (state, card) => {
                                    const instance = getCardInstanceFromId(state, id)!;
                                    sendCardToGraveyardByEffect(state, instance, card);
                                },
                                "laynoheart_1"
                            );
                        }
                    );
                },
                true
            );
        },
        onAnywhereToGraveyardByEffect: (state, card) => {
            if (new CardSelector(state).hand().filter().include("ティアラメンツ").len() === 0) {
                return;
            }
            if (!withTurnAtOneceCondition(state, card, () => true, "laynoheart_2")) {
                return;
            }
            withOption(
                state,
                card,
                [
                    {
                        name: "このカードを特殊召喚し、自分の手札から「ティアラメンツ」カード１枚を選んで墓地へ送る。",
                        condition: () => true,
                    },
                ],
                (state, card) => {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            withUserSummon(state, card, card, { summonType: "Special" }, (state, card) => {
                                withUserSelectCard(
                                    state,
                                    card,
                                    (state) => new CardSelector(state).hand().filter().include("ティアラメンツ").get(),
                                    { select: "single" },
                                    (state, card, selected) => {
                                        sendCardToGraveyardByEffect(state, selected[0], card);
                                    }
                                );
                            });
                        },
                        "laynoheart_2"
                    );
                }
            );
        },
    },
} satisfies LeveledMonsterCard;
