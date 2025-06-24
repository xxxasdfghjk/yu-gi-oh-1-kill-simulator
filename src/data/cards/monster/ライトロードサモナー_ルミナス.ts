import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withUserSummon,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "ライトロード・サモナー ルミナス",
    card_type: "モンスター" as const,
    text: "①：１ターンに１度、手札を１枚捨て、自分の墓地のレベル４以下の「ライトロード」モンスター１体を対象として発動できる。そのモンスターを特殊召喚する。②：自分エンドフェイズに発動する。自分のデッキの上からカードを３枚墓地へ送る。",
    image: "card1002382_1.jpg",
    monster_type: "効果モンスター",
    level: 3,
    element: "光" as const,
    race: "魔法使い" as const,
    attack: 1000,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const graveyard = (state: GameStore) =>
                            new CardSelector(state).graveyard().filter().include("ライトロード").underLevel(4).get();

                        return (
                            state.hand.length > 0 &&
                            graveyard(state).length > 0 &&
                            card.location === "MonsterField" &&
                            hasEmptyMonsterZone(state)
                        );
                    },
                    "LighlordLuminus_Ignition",
                    true
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const handCards = (state: GameStore) => new CardSelector(state).hand().getNonNull();

                        withUserSelectCard(
                            state,
                            card,
                            handCards,
                            {
                                select: "single",
                                message: "捨てる手札を選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Graveyard");

                                    const lightlordInGrave = (state: GameStore) =>
                                        new CardSelector(state)
                                            .graveyard()
                                            .filter()
                                            .include("ライトロード")
                                            .underLevel(4)
                                            .get();

                                    withUserSelectCard(
                                        state,
                                        card,
                                        lightlordInGrave,
                                        {
                                            select: "single",
                                            message: "特殊召喚する「ライトロード」モンスターを選択してください",
                                        },
                                        (state, card, selected2) => {
                                            if (selected2.length > 0) {
                                                withUserSummon(
                                                    state,
                                                    card,
                                                    selected2[0],
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
                            }
                        );
                    },
                    "LighlordLuminus_Ignition",
                    true
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
