import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withLifeChange,
    withOption,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";
import { isTrapCard } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "トランザクション・ロールバック",
    card_type: "罠" as const,
    text: "このカード名の(1)(2)の効果は１ターンに１度、いずれか１つしか使用できない。(1)：ＬＰを半分払い、「トランザクション・ロールバック」以外の相手の墓地の通常罠カード１枚を対象として発動できる。この効果は、その通常罠カード発動時の効果と同じになる。(2)：墓地のこのカードを除外し、ＬＰを半分払い、「トランザクション・ロールバック」以外の自分の墓地の通常罠カード１枚を対象として発動できる。この効果は、その通常罠カード発動時の効果と同じになる。",
    image: "card100354692_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        // 自分の墓地の通常罠カード（トランザクション・ロールバック以外）
                        const playerNormalTraps = new CardSelector(state)
                            .graveyard()
                            .getNonNull()
                            .filter(
                                (c) =>
                                    isTrapCard(c.card) &&
                                    c.card.trap_type === "通常罠" &&
                                    c.card.card_name !== "トランザクション・ロールバック"
                            );

                        return card.location === "Graveyard" && playerNormalTraps.length > 0;
                    },
                    "TransactionRollback_Effect"
                );
            },
            effect: (state, card, _context, resolve) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const playerNormalTraps = new CardSelector(state)
                            .graveyard()
                            .getNonNull()
                            .filter(
                                (c) =>
                                    isTrapCard(c.card) &&
                                    c.card.card_type === "罠" &&
                                    c.card.trap_type === "通常罠" &&
                                    c.card.card_name !== "トランザクション・ロールバック"
                            );

                        const options = [];
                        if (card.location === "Graveyard" && playerNormalTraps.length > 0) {
                            options.push({
                                name: "墓地のこのカードを除外して自分の墓地の通常罠カードを対象にする",
                                condition: (state: GameStore) => {
                                    return (
                                        new CardInstanceFilter(state.graveyard)
                                            .exclude("トランザクションロールバック")
                                            .len() > 0
                                    );
                                },
                            });
                        }

                        if (options.length === 0) {
                            if (resolve) resolve(state, card);
                            return;
                        }

                        withOption(state, card, options, (state, card, selectedOption) => {
                            if (selectedOption === "墓地のこのカードを除外して自分の墓地の通常罠カードを対象にする") {
                                // (2)の効果：墓地のこのカードを除外
                                sendCard(state, card, "Exclusion");

                                withLifeChange(
                                    state,
                                    card,
                                    {
                                        target: "player",
                                        amount: Math.floor(state.lifePoints / 2),
                                        operation: "decrease",
                                    },
                                    (state, card) => {
                                        withUserSelectCard(
                                            state,
                                            card,
                                            (state) =>
                                                new CardSelector(state)
                                                    .graveyard()
                                                    .filter()
                                                    .exclude("トランザクション・ロールバック")
                                                    .trap()
                                                    .get(),
                                            {
                                                select: "single",
                                                message: "対象とする自分の墓地の通常罠カードを選択してください",
                                            },
                                            (state, card, selected) => {
                                                if (selected.length > 0) {
                                                    const targetTrap = selected[0];
                                                    // 効果をコピーして発動（簡略化：効果名を表示のみ）
                                                    targetTrap.card.effect?.onSpell?.effect?.(state, card);
                                                    // 実際の実装では完全な効果コピーが必要
                                                }
                                                if (resolve) resolve(state, card);
                                            }
                                        );
                                    }
                                );
                            }
                        });
                    },
                    "TransactionRollback_Effect"
                );
            },
        },
    },
} satisfies TrapCard;
