import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSummon,
    withSendToGraveyardFromDeckTop,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "ライトロード・デーモン ヴァイス",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：手札から他の「ライトロード」カード１枚をデッキの一番上に戻して発動できる。このカードを手札から特殊召喚する。その後、自分のデッキの上からカードを２枚墓地へ送る。②：このカードがデッキから墓地へ送られた場合、「ライトロード・デーモン ヴァイス」以外の自分の墓地の「ライトロード」モンスター１体を対象として発動できる。そのモンスターを特殊召喚する。",
    image: "card100325862_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "悪魔" as const,
    attack: 0,
    defense: 1700,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    hasTuner: true,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const lightlordInHand = new CardSelector(state)
                            .hand()
                            .filter()
                            .lightsworn()
                            .excludeId(card.id)
                            .get();

                        return lightlordInHand.length > 0 && card.location === "Hand" && hasEmptyMonsterZone(state);
                    },
                    "LightlordVice_HandEffect"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const lightlordInHand = (state: GameStore) =>
                            new CardSelector(state).hand().filter().lightsworn().excludeId(card.id).get();

                        withUserSelectCard(
                            state,
                            card,
                            lightlordInHand,
                            {
                                select: "single",
                                message: "デッキの一番上に戻す「ライトロード」カードを選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Deck", { deckTop: true });

                                    // ヴァイスを特殊召喚
                                    withUserSummon(
                                        state,
                                        card,
                                        card,
                                        {
                                            canSelectPosition: true,
                                            optionPosition: ["attack", "defense"],
                                        },
                                        (state, card) => {
                                            // デッキの上から2枚墓地に送る
                                            withSendToGraveyardFromDeckTop(state, card, 2, () => {});
                                        }
                                    );
                                }
                            }
                        );
                    },
                    "LightlordVice_HandEffect"
                );
            },
        },
        onDeckToGraveyard: (state, card) => {
            if (!hasEmptyMonsterZone(state)) {
                return;
            }

            const lightlordInGrave = (state: GameStore) =>
                new CardSelector(state)
                    .graveyard()
                    .filter()
                    .monster()
                    .lightsworn()
                    .exclude("ライトロード・デーモン ヴァイス")
                    .get();

            if (lightlordInGrave(state).length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    lightlordInGrave,
                    {
                        select: "single",
                        message: "特殊召喚する「ライトロード」モンスターを選択してください",
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            withUserSummon(
                                state,
                                card,
                                selected[0],
                                {
                                    canSelectPosition: true,
                                    optionPosition: ["attack", "defense"],
                                },
                                () => {}
                            );
                        }
                    }
                );
            }
        },
    },
} satisfies LeveledMonsterCard;
