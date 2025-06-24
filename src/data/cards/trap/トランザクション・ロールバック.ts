import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceEffect, withLifeChange } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";

export default {
    card_name: "トランザクション・ロールバック",
    card_type: "罠" as const,
    text: "このカード名の(1)(2)の効果は１ターンに１度、いずれか１つしか使用できない。(1)：ＬＰを半分払い、「トランザクション・ロールバック」以外の相手の墓地の通常罠カード１枚を対象として発動できる。この効果は、その通常罠カード発動時の効果と同じになる。(2)：墓地のこのカードを除外し、ＬＰを半分払い、「トランザクション・ロールバック」以外の自分の墓地の通常罠カード１枚を対象として発動できる。この効果は、その通常罠カード発動時の効果と同じになる。",
    image: "card100354692_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return (
                    card.location === "Graveyard" &&
                    new CardSelector(state).graveyard().filter().excludeId(card.id).trap().len() > 0
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
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
                                        targetTrap.card.effect?.onSpell?.effect?.(state, card);
                                    }
                                }
                            );
                        }
                    );
                });
            },
        },
    },
} satisfies TrapCard;
