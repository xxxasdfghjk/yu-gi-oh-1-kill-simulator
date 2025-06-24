import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getAttack, getDefense, hasEmptyMonsterZone } from "@/utils/gameUtils";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "光道の龍",
    card_type: "モンスター" as const,
    text: "このカード名の①②③の効果はそれぞれ１ターンに１度しか使用できない。 ①：自分の墓地に「ライトロード」モンスターが存在する場合に発動できる。 このカードを手札から特殊召喚する。 ②：このカードが特殊召喚した場合に発動できる。 デッキから「光道の龍」以外の「ライトロード」カード１枚を墓地へ送る。 ③：このカードが墓地へ送られた場合に発動できる。 デッキから攻撃力３０００／守備力２６００のドラゴン族モンスター１体を手札に加える。",
    image: "card100325859_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "ドラゴン" as const,
    attack: 1500,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        // ①の効果：墓地にライトロードモンスターが存在する場合、手札から特殊召喚
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const lightlordInGraveyard = new CardSelector(state)
                            .graveyard()
                            .filter()
                            .monster()
                            .get()
                            .filter((c) => c.card.card_name.includes("ライトロード"));

                        return (
                            card.location === "Hand" && lightlordInGraveyard.length > 0 && hasEmptyMonsterZone(state)
                        );
                    },
                    "KoudouDragon_Effect1"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        withUserSummon(
                            state,
                            card,
                            card,
                            {
                                canSelectPosition: true,
                                optionPosition: ["attack", "defense"],
                                summonType: "Special",
                            },
                            () => {}
                        );
                    },
                    "KoudouDragon_Effect1"
                );
            },
        },

        // ②の効果：特殊召喚した場合、デッキから「光道の龍」以外のライトロードカードを墓地に送る
        onSummon: (state, card) => {
            if (card.summonedBy === "Special") {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const lightlordCardsInDeck = (state: GameStore) =>
                            new CardSelector(state)
                                .deck()
                                .getNonNull()
                                .filter(
                                    (c) => c.card.card_name.includes("ライトロード") && c.card.card_name !== "光道の龍"
                                );

                        const availableCards = lightlordCardsInDeck(state);

                        if (availableCards.length > 0) {
                            withUserSelectCard(
                                state,
                                card,
                                lightlordCardsInDeck,
                                {
                                    select: "single",
                                    message: "墓地に送る「ライトロード」カードを選択してください",
                                },
                                (state, _card, selected) => {
                                    if (selected.length > 0) {
                                        sendCard(state, selected[0], "Graveyard");
                                    }
                                }
                            );
                        }
                    },
                    "KoudouDragon_Effect2"
                );
            }
        },

        // ③の効果：墓地に送られた場合、攻撃力3000/守備力2600のドラゴン族モンスターを手札に加える
        onAnywhereToGraveyard: (state, card) => {
            withTurnAtOneceEffect(
                state,
                card,
                (state, card) => {
                    const targetDragonsInDeck = (state: GameStore) =>
                        new CardSelector(state)
                            .deck()
                            .filter()
                            .monster()
                            .race("ドラゴン")
                            .get()
                            .filter((c) => getAttack(c) === 3000 && getDefense(c) === 2600);

                    const availableDragons = targetDragonsInDeck(state);

                    if (availableDragons.length > 0) {
                        withUserSelectCard(
                            state,
                            card,
                            targetDragonsInDeck,
                            {
                                select: "single",
                                message: "手札に加える攻撃力3000/守備力2600のドラゴン族モンスターを選択してください",
                            },
                            (state, _card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Hand");
                                }
                            }
                        );
                    }
                },
                "KoudouDragon_Effect3"
            );
        },
    },
} satisfies LeveledMonsterCard;
