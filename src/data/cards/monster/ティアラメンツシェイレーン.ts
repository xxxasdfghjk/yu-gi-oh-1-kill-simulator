import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withSendToGraveyardFromDeckTop,
    withOption,
    withSendToDeckBottom,
    withSendToGraveyard,
} from "@/utils/effectUtils";
import type { FusionMonsterCard, LeveledMonsterCard } from "@/types/card";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "ティアラメンツ・シェイレーン",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：自分メインフェイズに発動できる。このカードを手札から特殊召喚し、自分の手札からモンスター１体を選んで墓地へ送る。その後、自分のデッキの上からカードを３枚墓地へ送る。②：このカードが効果で墓地へ送られた場合に発動できる。融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で持ち主のデッキの下に戻し、その融合モンスター１体をEXデッキから融合召喚する。",
    image: "card100260390_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "水" as const,
    attack: 1800,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return (
                    card.location === "Hand" &&
                    new CardSelector(state).hand().filter().monster().excludeId(card.id).len() > 0
                );
            },
            effect: (state, card) => {
                if (!withTurnAtOneceCondition(state, card, () => true, "sheilane_2")) {
                    return;
                }
                if (state.deck.length <= 2) {
                    return;
                }
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        withUserSummon(state, card, card, { summonType: "Special" }, (state, card) => {
                            const id = card.id;
                            withUserSelectCard(
                                state,
                                card,
                                (state) => new CardSelector(state).hand().filter().monster().excludeId(id).get(),
                                { select: "single" },
                                (state, card, selected) => {
                                    withSendToGraveyard(
                                        state,
                                        card,
                                        selected,
                                        (state, card) => {
                                            withSendToGraveyardFromDeckTop(
                                                state,
                                                card,
                                                Math.min(3, state.deck.length),
                                                () => {},
                                                { byEffect: true }
                                            );
                                        },
                                        { byEffect: true }
                                    );
                                }
                            );
                        });
                    },
                    "sheilane_2"
                );
            },
        },
        onAnywhereToGraveyardByEffect: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "sheilane_1")) {
                return;
            }
            withOption(
                state,
                card,
                [
                    {
                        name: "融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で持ち主のデッキの下に戻し、その融合モンスター１体をEXデッキから融合召喚する。",
                        condition: () => true,
                    },
                ],
                (state, card) => {
                    withUserSelectCard(
                        state,
                        card,
                        (state) => new CardSelector(state).extraDeck().filter().fusionMonster().get(),
                        { select: "single", canCancel: true },
                        (state, card, selected) => {
                            const selectedFusionCard = selected[0];
                            const fusionId = selectedFusionCard.id;
                            const cardId = card.id;
                            withUserSelectCard(
                                state,
                                card,
                                (state) => {
                                    return new CardSelector(state)
                                        .hand()
                                        .allMonster()
                                        .graveyard()
                                        .filter()
                                        .monster()
                                        .get();
                                },
                                {
                                    select: "multi",
                                    condition: (cardList) =>
                                        (selectedFusionCard.card as FusionMonsterCard).materialCondition(cardList) &&
                                        !!cardList.find((e) => e.id === cardId),
                                    canCancel: true,
                                },
                                (state, card, selected) => {
                                    const id = selected.map((e) => e.id);
                                    withTurnAtOneceEffect(
                                        state,
                                        card,
                                        (state, card) => {
                                            const instanceList = id.map((e) => getCardInstanceFromId(state, e)!);
                                            withSendToDeckBottom(state, card, instanceList, (state) => {
                                                const instance = getCardInstanceFromId(state, fusionId)!;
                                                withUserSummon(
                                                    state,
                                                    instance,
                                                    instance,
                                                    { summonType: "Fusion" },
                                                    () => {}
                                                );
                                            });
                                        },
                                        "sheilane_1"
                                    );
                                }
                            );
                        }
                    );
                },
                true
            );
        },
    },
} satisfies LeveledMonsterCard;
