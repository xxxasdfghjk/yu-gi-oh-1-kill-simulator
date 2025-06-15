import type { MagicCard } from "@/types/card";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withOption,
    withDelayRecursive,
} from "@/utils/effectUtils";
import { sendCard, randomExtractDeck } from "@/utils/cardMovement";
import { sendCardById } from "../../../../../utils/cardMovement";

const card = {
    card_name: "金満で謙虚な壺",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分はカードの効果でドローできない。①：自分のＥＸデッキのカード３枚または６枚を裏側表示で除外して発動できる。除外した数だけ自分のデッキの上からカードをめくり、その中から１枚を選んで手札に加え、残りのカードを好きな順番でデッキの一番下に戻す。ターン終了時まで相手が受ける全てのダメージは半分になる。",
    image: "card100214871_1.jpg",
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(state, card, (state) => state.extraDeck.length >= 3 && state.deck.length >= 3),
            effect: (state, card) =>
                withTurnAtOneceEffect(state, card, () => {
                    withOption(
                        state,
                        card,
                        [
                            {
                                name: "３枚除外",
                                condition: (state) => state.extraDeck.length >= 3 && state.deck.length >= 3,
                            },
                            {
                                name: "６枚除外",
                                condition: (state) => state.extraDeck.length >= 6 && state.deck.length >= 6,
                            },
                        ],
                        (state, card, option) => {
                            const excludeNum = option === "３枚除外" ? 3 : 6;
                            const idList = randomExtractDeck(state, excludeNum).map((e) => e.id);

                            withDelayRecursive(
                                state,
                                card,
                                { delay: 50 },
                                6,
                                (state, _card, depth) => {
                                    sendCardById(state, idList[depth - 1], "Exclusion");
                                },
                                (state, card) => {
                                    withUserSelectCard(
                                        state,
                                        card,
                                        (state) => state.deck.slice(0, excludeNum),
                                        { select: "single" as const, message: "手札に加えるカードを選択してください" },
                                        (state, _cardInstance, selected) => {
                                            sendCard(state, selected[0], "Hand" as const);
                                        }
                                    );
                                }
                            );
                        }
                    );
                }),
        },
    },
} satisfies MagicCard;

export default card;
