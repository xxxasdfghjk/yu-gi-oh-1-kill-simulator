import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withSendToGraveyardFromDeckTop,
    withOption,
} from "@/utils/effectUtils";
import { sendCardToGraveyardByEffect } from "@/utils/cardMovement";
import type { LinkMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "ライトロード・ドミニオン キュリオス",
    card_type: "モンスター" as const,
    text: "同じ属性で種族が異なるモンスター３体\nこのカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードがリンク召喚に成功した場合に発動できる。デッキからカード１枚を選んで墓地へ送る。②：自分のデッキのカードが効果で墓地へ送られた場合に発動する。自分のデッキの上からカードを３枚墓地へ送る。③：表側表示のこのカードが相手の効果でフィールドから離れた場合、または戦闘で破壊された場合、自分の墓地のカード１枚を対象として発動できる。そのカードを手札に加える。",
    image: "card100062061_1.jpg",
    monster_type: "リンクモンスター",
    link: 3,
    linkDirection: ["上", "左下", "右下"] as const,
    element: "光" as const,
    race: "戦士" as const,
    attack: 2400,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    effect: {
        onCardDeckToGraveyard: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "dominion_3")) {
                return;
            }
            if (
                state.effectQueue.find(
                    (e) => e.type === "option" && e.effectName === `${card.card.card_name}（選択肢）`
                ) !== undefined
            ) {
                return;
            }
            if (state.deck.length >= 3) {
                withOption(
                    state,
                    card,
                    [
                        {
                            name: "自分のデッキの上からカードを３枚墓地へ送る",
                            condition: (state, card) => {
                                return withTurnAtOneceCondition(state, card, () => true, "dominion_3");
                            },
                        },
                    ],
                    (state, card) => {
                        withTurnAtOneceEffect(
                            state,
                            card,
                            (state, card) => {
                                withSendToGraveyardFromDeckTop(state, card, 3, () => {}, { byEffect: true });
                            },
                            "dominion_3"
                        );
                    },
                    true
                );
            }
        },
        onSummon: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "dominion_1")) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                (state) => new CardSelector(state).deck().getNonNull(),
                {
                    select: "single",
                    message: "墓地へ送るカードを選択してください",
                },
                (state, card, selected) => {
                    const id = selected[0].id;
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            const instance = getCardInstanceFromId(state, id)!;
                            sendCardToGraveyardByEffect(state, instance, card);
                        },
                        "dominion_1"
                    );
                }
            );
        },
    },
    materialCondition: (card) => {
        if (card.length !== 3) {
            return false;
        }
        const elementNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.element, e.card.element]) || ["", ""])).values()
        ).length;
        const raceNum = Array.from(
            new Map(card.map((e) => (monsterFilter(e.card) && [e.card.race, e.card.race]) || ["", ""])).values()
        ).length;
        return elementNum === 1 && raceNum === 3;
    },
    filterAvailableMaterials: () => true,
} satisfies LinkMonsterCard;
