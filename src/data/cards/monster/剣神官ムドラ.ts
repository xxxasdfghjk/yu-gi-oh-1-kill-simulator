import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withUserConfirm,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "剣神官ムドラ",
    card_type: "モンスター" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。 ①：手札から他の天使族・地属性モンスター１体を捨てて発動できる。 このカードを手札から特殊召喚する。 その後、デッキから「墓守の罠」１枚を選んで自分の魔法＆罠ゾーンに表側表示で置く事ができる。 ②：自分・相手ターンに、フィールド・墓地のこのカードを除外し、自分・相手の墓地のカードを合計５枚まで対象として発動できる。 そのカードをデッキに戻す。 自分のフィールド及び墓地に「現世と冥界の逆転」が存在しない場合、この効果の対象は３枚までとなる。",
    image: "card100264017_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "地" as const,
    race: "天使" as const,
    attack: 1500,
    defense: 1800,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        // ①の効果：手札から天使族・地属性モンスターを捨てて特殊召喚
        onIgnition: {
            condition: (state, card) => {
                return (
                    withTurnAtOneceCondition(
                        state,
                        card,
                        (state, card) => {
                            const angelEarthMonstersInHand = new CardSelector(state)
                                .hand()
                                .filter()
                                .monster()
                                .race("天使")
                                .element("地")
                                .get()
                                .filter((c) => c.id !== card.id); // 自分以外

                            return card.location === "Hand" && angelEarthMonstersInHand.length > 0;
                        },
                        "KenshinkanMudra_Effect1"
                    ) ||
                    withTurnAtOneceCondition(
                        state,
                        card,
                        (state, card) => {
                            return (
                                new CardSelector(state).graveyard().len() > 0 &&
                                (card.location === "MonsterField" || card.location === "Graveyard")
                            );
                        },
                        "KenshinkanMudra_Effect2"
                    )
                );
            },
            effect: (state, card) => {
                if (card.location === "Hand") {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            const angelEarthMonstersInHand = (state: GameStore) =>
                                new CardSelector(state)
                                    .hand()
                                    .filter()
                                    .monster()
                                    .race("天使")
                                    .element("地")
                                    .get()
                                    .filter((c) => c.id !== card.id);

                            withUserSelectCard(
                                state,
                                card,
                                angelEarthMonstersInHand,
                                {
                                    select: "single",
                                    message: "捨てる天使族・地属性モンスターを選択してください",
                                },
                                (state, card, selected) => {
                                    if (selected.length > 0) {
                                        // 選択したモンスターを墓地に送る
                                        sendCard(state, selected[0], "Graveyard");

                                        // 剣神官ムドラを特殊召喚
                                        withUserSummon(
                                            state,
                                            card,
                                            card,
                                            {
                                                canSelectPosition: true,
                                                optionPosition: ["attack", "defense"],
                                            },
                                            (state, card) => {
                                                // その後、デッキから「墓守の罠」を選択
                                                const gravekeeperTrapsInDeck = (state: GameStore) =>
                                                    new CardSelector(state)
                                                        .deck()
                                                        .getNonNull()
                                                        .filter((c) => c.card.card_name.includes("墓守の罠"));

                                                const availableTraps = gravekeeperTrapsInDeck(state);

                                                if (availableTraps.length > 0) {
                                                    withUserConfirm(
                                                        state,
                                                        card,
                                                        {
                                                            message: "「墓守の罠」を魔法&罠ゾーンに置きますか？",
                                                        },
                                                        (state, card) => {
                                                            withUserSelectCard(
                                                                state,
                                                                card,
                                                                gravekeeperTrapsInDeck,
                                                                {
                                                                    select: "single",
                                                                    message:
                                                                        "魔法&罠ゾーンに置く「墓守の罠」を選択してください",
                                                                },
                                                                (state, card, selected) => {
                                                                    if (selected.length > 0) {
                                                                        sendCard(state, selected[0], "SpellField");
                                                                    }
                                                                }
                                                            );
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        },
                        "KenshinkanMudra_Effect1"
                    );
                } else {
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            // このカードを除外
                            sendCard(state, card, "Exclusion");

                            const maxTargets = 3;

                            const graveyardCards = (state: GameStore) =>
                                new CardSelector(state).graveyard().getNonNull();

                            const availableCards = graveyardCards(state);

                            if (availableCards.length > 0) {
                                withUserSelectCard(
                                    state,
                                    card,
                                    graveyardCards,
                                    {
                                        select: "multi",
                                        condition: (cards) => {
                                            return cards.length <= maxTargets;
                                        },
                                        message: `デッキに戻すカードを最大${maxTargets}枚選択してください`,
                                    },
                                    (state, _card, selected) => {
                                        selected.forEach((selectedCard) => {
                                            sendCard(state, selectedCard, "Deck");
                                        });
                                    }
                                );
                            }
                        },
                        "KenshinkanMudra_Effect2"
                    );
                }
            },
        },
    },
} satisfies LeveledMonsterCard;
