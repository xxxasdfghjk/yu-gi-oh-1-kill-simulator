import type { MagicCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { shuffleDeck } from "@/utils/gameUtils";

const card = {
    card_name: "エマージェンシー・サイバー",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "このカード名のカードは１ターンに１枚しか発動できない。①：デッキから「サイバー・ドラゴン」モンスターまたは通常召喚できない機械族・光属性モンスター１体を手札に加える。②：相手によってこのカードの発動が無効になり、このカードが墓地へ送られた場合、手札を１枚捨てて発動できる。このカードを手札に加える。",
    image: "card100095117_1.jpg",
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(
                    state,
                    card,
                    (state) =>
                        !!state.deck.find(
                            (e) =>
                                monsterFilter(e.card) &&
                                e.card.race === "機械" &&
                                e.card.element === "光" &&
                                e.card.canNormalSummon === false
                        )
                ),
            effect: (state, card, _, resolve) =>
                withTurnAtOneceEffect(state, card, (state, card) => {
                    if (
                        state.deck.filter(
                            (e) =>
                                monsterFilter(e.card) &&
                                e.card.race === "機械" &&
                                e.card.element === "光" &&
                                e.card.canNormalSummon === false
                        ).length === 0
                    ) {
                        resolve?.(state, card);
                        return;
                    }
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck.filter(
                                (e) =>
                                    monsterFilter(e.card) &&
                                    e.card.race === "機械" &&
                                    e.card.element === "光" &&
                                    e.card.canNormalSummon === false
                            ),
                        {
                            select: "single" as const,
                            message: "デッキから手札に加える機械族・光属性モンスターを選択してください",
                        },
                        (state, card, selected) => {
                            sendCard(state, selected[0], "Hand" as const);
                            shuffleDeck(state);
                            resolve?.(state, card);
                        }
                    );
                }),
        },
    },
} satisfies MagicCard;

export default card;
