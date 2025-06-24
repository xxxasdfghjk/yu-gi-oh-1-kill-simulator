import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withSendDeckBottom,
    withDraw,
    withTurnAtOneceEffect,
    withOption,
    withUserSummon,
    withTurnAtOneceCondition,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getLevel, shuffleDeck } from "@/utils/gameUtils";
import type { XyzMonsterCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";

export default {
    card_name: "ダイガスタ・エメラル",
    card_type: "モンスター" as const,
    text: "レベル４モンスター×２\n①：１ターンに１度、このカードのX素材を１つ取り除き、以下の効果から１つを選択して発動できる。●自分の墓地のモンスター３体を対象として発動できる。そのモンスター３体をデッキに加えてシャッフルする。その後、自分はデッキから１枚ドローする。●効果モンスター以外の自分の墓地のモンスター１体を対象として発動できる。そのモンスターを特殊召喚する。",
    image: "card100065390_1.jpg",
    monster_type: "エクシーズモンスター",
    element: "風" as const,
    race: "岩石" as const,
    attack: 1800,
    defense: 800,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    rank: 4,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onIgnition: {
            condition: (state, card) =>
                withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        return (
                            card.materials.length > 0 &&
                            (new CardSelector(state).graveyard().monster().len() >= 3 ||
                                new CardSelector(state).graveyard().filter().monster().len() > 0)
                        ); // TODO
                    },
                    card.id,
                    true
                ),
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        if (card.materials.length > 0) {
                            withUserSelectCard(
                                state,
                                card,
                                () => card.materials,
                                { select: "single" },
                                (state, card, selected) => {
                                    sendCard(state, selected[0], "Graveyard");
                                    withOption(
                                        state,
                                        card,
                                        [
                                            {
                                                name: "自分の墓地のモンスター３体を対象として発動できる。そのモンスター３体をデッキに加えてシャッフルする。その後、自分はデッキから１枚ドローする。",
                                                condition: (state) =>
                                                    new CardSelector(state).graveyard().filter().monster().len() >= 3,
                                            },
                                            {
                                                name: "効果モンスター以外の自分の墓地のモンスター１体を対象として発動できる。そのモンスターを特殊召喚する。",
                                                condition: (state) =>
                                                    new CardSelector(state)
                                                        .graveyard()
                                                        .filter()
                                                        .monster()
                                                        .get()
                                                        .filter(
                                                            (e) =>
                                                                monsterFilter(e.card) &&
                                                                e.card.monster_type === "通常モンスター"
                                                        ).length > 0, // TODO
                                            },
                                        ],
                                        (state, card, option) => {
                                            if (
                                                option ===
                                                "効果モンスター以外の自分の墓地のモンスター１体を対象として発動できる。そのモンスターを特殊召喚する。"
                                            ) {
                                                withUserSelectCard(
                                                    state,
                                                    card,
                                                    (state) =>
                                                        new CardSelector(state)
                                                            .graveyard()
                                                            .filter()
                                                            .monster()
                                                            .get()
                                                            .filter(
                                                                (e) =>
                                                                    monsterFilter(e.card) &&
                                                                    e.card.monster_type === "通常モンスター"
                                                            ),
                                                    { select: "single" },
                                                    (state, card, selected) => {
                                                        withUserSummon(state, card, selected[0], {}, () => {});
                                                    }
                                                );
                                            } else {
                                                withUserSelectCard(
                                                    state,
                                                    card,
                                                    (state) =>
                                                        new CardSelector(state).graveyard().filter().monster().get(),
                                                    { select: "multi", condition: (cards) => cards.length === 3 },
                                                    (state, card, selected) => {
                                                        withSendDeckBottom(
                                                            state,
                                                            card,
                                                            selected.map((e) => e.id),
                                                            (state, card) => {
                                                                shuffleDeck(state);
                                                                withDraw(state, card, { count: 1 }, () => {});
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            );
                        }
                    },
                    card.id,
                    true
                );
            },
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card) && card.card.hasLevel && getLevel(card) === 4;
    },
    materialCondition: (cards) => {
        return cards.length === 2 && new CardInstanceFilter(cards).level(4).len() === 2;
    },
} satisfies XyzMonsterCard;
