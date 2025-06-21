import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withDraw,
    withDelay,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "蘇りし天空神",
    card_type: "罠" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できず、その発動と効果は無効化されない。①：自分の墓地から「オシリスの天空竜」１体を選んで特殊召喚する。その後、お互いはそれぞれ手札が６枚になるようにデッキからドローする。②：墓地のこのカードを除外して発動できる。自分のデッキ・墓地から「死者蘇生」１枚を選んでデッキの一番上に置く。自分の墓地に幻神獣族モンスターが存在する場合、さらに自分はデッキから１枚ドローする。",
    image: "card100278144_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state) => {
                        const osirisInGraveyard = new CardSelector(state)
                            .graveyard()
                            .filter()
                            .include("オシリスの天空竜")
                            .get();

                        return osirisInGraveyard.length > 0;
                    },
                    "Yomigaeshi_TenkuShin_Effect1"
                );
            },
            effect: (state, card, _context, resolve) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const osirisInGraveyard = (state: GameStore) =>
                            new CardSelector(state).graveyard().filter().include("オシリスの天空竜").get();

                        // ①の効果：オシリスの天空竜を特殊召喚
                        withUserSelectCard(
                            state,
                            card,
                            osirisInGraveyard,
                            {
                                select: "single",
                                message: "特殊召喚する「オシリスの天空竜」を選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    const selectedOsiris = selected[0];
                                    withUserSummon(
                                        state,
                                        card,
                                        selectedOsiris,
                                        {
                                            canSelectPosition: true,
                                            optionPosition: ["attack", "defense"],
                                        },
                                        (state, card) => {
                                            // 召喚後、お互い手札が6枚になるようにドロー
                                            const playerHandCount = state.hand.length;

                                            const playerDrawCount = Math.max(0, 6 - playerHandCount);

                                            // プレイヤーのドロー
                                            if (playerDrawCount > 0) {
                                                withDraw(state, card, { count: playerDrawCount }, (state, card) => {
                                                    if (resolve) resolve(state, card);
                                                });
                                            } else {
                                                if (resolve) resolve(state, card);
                                            }
                                        }
                                    );
                                } else {
                                    if (resolve) resolve(state, card);
                                }
                            }
                        );
                    },
                    "Yomigaeshi_TenkuShin_Effect1"
                );
            },
        },
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const shiShaSuseiInDeckGraveyard = new CardSelector(state)
                            .deck()
                            .graveyard()
                            .filter()
                            .include("死者蘇生")
                            .get();

                        return card.location === "Graveyard" && shiShaSuseiInDeckGraveyard.length > 0;
                    },
                    "Yomigaeshi_TenkuShin_Effect2"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // ②の効果：このカードを除外して死者蘇生をデッキトップに
                        sendCard(state, card, "Exclusion");

                        const shiShaSuseiInDeckGraveyard = (state: GameStore) =>
                            new CardSelector(state).deck().graveyard().filter().include("死者蘇生").get();

                        withUserSelectCard(
                            state,
                            card,
                            shiShaSuseiInDeckGraveyard,
                            {
                                select: "single",
                                message: "デッキの一番上に置く「死者蘇生」を選択してください",
                            },
                            (state, card, selected) => {
                                if (selected.length > 0) {
                                    const shiShaSusei = selected[0];
                                    sendCard(state, shiShaSusei, "Deck", { deckTop: true });

                                    // 自分の墓地に幻神獣族モンスターが存在するかチェック
                                    const genshinBeastInGraveyard = new CardSelector(state)
                                        .graveyard()
                                        .filter()
                                        .monster()
                                        .race("幻神獣")
                                        .get();

                                    if (genshinBeastInGraveyard.length > 0) {
                                        withDelay(state, card, {}, (state, card) => {
                                            // さらに1枚ドロー
                                            withDraw(state, card, { count: 1 });
                                        });
                                    }
                                }
                            }
                        );
                    },
                    "Yomigaeshi_TenkuShin_Effect2"
                );
            },
        },
    },
} satisfies TrapCard;
