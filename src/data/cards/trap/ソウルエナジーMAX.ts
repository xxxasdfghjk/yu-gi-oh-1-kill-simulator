import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withLifeChange,
    withOption,
    withUserSummon,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getCardInstanceFromId } from "@/utils/gameUtils";

export default {
    card_name: "ソウルエナジーMAX!!",
    card_type: "罠" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：自分フィールドに元々の属性が神属性となる「オベリスクの巨神兵」が存在する場合、自分フィールドの他の表側表示モンスター２体をリリースして発動できる。相手フィールドのモンスターを全て破壊し、相手に４０００ダメージを与える。②：自分・相手のメインフェイズ及びバトルフェイズに、墓地のこのカードを除外して発動できる。自分のデッキ・墓地から「オベリスクの巨神兵」１体を選んで手札に加える。その後、「オベリスクの巨神兵」１体を召喚できる。",
    image: "card100254678_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state) => {
                        const obeliskOnField = new CardSelector(state)
                            .allMonster()
                            .filter()
                            .nonNull()
                            .include("オベリスクの巨神兵")
                            .element("神")
                            .get();

                        const otherMonstersOnField = new CardSelector(state).allMonster().filter().nonNull().get();

                        return obeliskOnField.length > 0 && otherMonstersOnField.length >= 2;
                    },
                    "SoulEnergyMax_Effect1"
                );
            },
            payCost: (state, card, afterCallback) => {
                const otherMonstersOnField = (state: GameStore) =>
                    new CardSelector(state).allMonster().filter().nonNull().get();

                withUserSelectCard(
                    state,
                    card,
                    otherMonstersOnField,
                    {
                        select: "multi",
                        condition: (selected) => selected.length === 2,
                        message: "リリースするモンスター2体を選択してください",
                    },
                    (state, card, selected) => {
                        if (selected.length === 2) {
                            selected.forEach((monster) => {
                                sendCard(state, monster, "Graveyard");
                            });
                        }
                        afterCallback(state, card);
                    }
                );
            },
            effect: (state, card, _context, resolve) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // 相手に4000ダメージ
                        withLifeChange(
                            state,
                            card,
                            {
                                target: "opponent",
                                amount: 4000,
                                operation: "decrease",
                            },
                            () => {
                                if (resolve) resolve(state, card);
                            }
                        );
                    },
                    "SoulEnergyMax_Effect1"
                );
            },
        },
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const phases = ["main1", "main2", "battle"];
                        const obeliskInDeckGraveyard = new CardSelector(state)
                            .deck()
                            .graveyard()
                            .filter()
                            .include("オベリスクの巨神兵")
                            .get();

                        return (
                            phases.includes(state.phase) &&
                            card.location === "Graveyard" &&
                            obeliskInDeckGraveyard.length > 0
                        );
                    },
                    "SoulEnergyMax_Effect2"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // このカードを除外
                        sendCard(state, card, "Exclusion");

                        const obeliskInDeckGraveyard = (state: GameStore) =>
                            new CardSelector(state).deck().graveyard().filter().include("オベリスクの巨神兵").get();

                        withUserSelectCard(
                            state,
                            card,
                            obeliskInDeckGraveyard,
                            {
                                select: "single",
                                message: "手札に加える「オベリスクの巨神兵」を選択してください",
                            },
                            (state, _card, selected) => {
                                sendCard(state, selected[0], "Hand");
                                const cardId = selected[0].id;
                                if (new CardSelector(state).allMonster().len() >= 3) {
                                    withOption(
                                        state,
                                        card,
                                        [{ name: "オベリスクの巨神兵を召喚", condition: () => true }],
                                        (state, _card, option) => {
                                            if (option === "オベリスクの巨神兵を召喚") {
                                                const god = getCardInstanceFromId(state, cardId)!;
                                                withUserSummon(state, god, god, { needRelease: 3 }, () => {});
                                            }
                                        },
                                        true
                                    );
                                }
                            }
                        );
                    },
                    "SoulEnergyMax_Effect2"
                );
            },
        },
    },
} satisfies TrapCard;
