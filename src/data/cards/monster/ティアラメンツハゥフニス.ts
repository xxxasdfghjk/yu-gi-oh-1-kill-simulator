import {
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withSendToDeckBottom,
    withUserSelectCard,
    withOption,
} from "@/utils/effectUtils";
import type { FusionMonsterCard, LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { getCardInstanceFromId, hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "ティアラメンツ・ハゥフニス",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：相手がフィールドのモンスターの効果を発動した時に発動できる。このカードを手札から特殊召喚し、自分のデッキの上からカードを３枚墓地へ送る。②：このカードが効果で墓地へ送られた場合に発動できる。融合モンスターカードによって決められた、墓地のこのカードを含む融合素材モンスターを自分の手札・フィールド・墓地から好きな順番で持ち主のデッキの下に戻し、その融合モンスター１体をEXデッキから融合召喚する。",
    image: "card100260474_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "闇" as const,
    race: "水" as const,
    attack: 1600,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onAnywhereToGraveyardByEffect: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true, "haufnis_1")) {
                return;
            }
            if (!hasEmptyMonsterZone(state)) {
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
                                        "haufnis_1"
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
