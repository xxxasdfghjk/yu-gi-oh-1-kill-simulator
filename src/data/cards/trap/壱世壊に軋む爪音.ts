import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceEffect, withTurnAtOneceCondition } from "@/utils/effectUtils";
import { sendCardById } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";

export default {
    card_name: "壱世壊に軋む爪音",
    card_type: "罠" as const,
    text: "このカード名の(1)(2)の効果は１ターンに１度、いずれか１つしか使用できない。(1)：自分フィールドに「ティアラメンツ」モンスターまたは「ヴィサス＝スタフロスト」が存在する場合、相手フィールドの表側表示モンスター１体を対象として発動できる。そのモンスターを裏側守備表示にする。その後、デッキから「ティアラメンツ」モンスター１体を墓地へ送る。(2)：このカードが効果で墓地へ送られた場合、自分の墓地の「ティアラメンツ」モンスター１体を対象として発動できる。そのモンスターを手札に加える。",
    image: "card100260561_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onAnywhereToGraveyardByEffect: (state, card, context) => {
            if (!withTurnAtOneceCondition(state, card, () => true)) {
                return;
            }
            if (new CardSelector(state).graveyard().filter().monster().include("ティアラメンツ").len() === 0) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                (state) => {
                    return new CardSelector(state).graveyard().filter().monster().include("ティアラメンツ").get();
                },
                { select: "single" },
                (state, _card, selected) => {
                    const selectedId = selected[0].id;
                    withTurnAtOneceEffect(state, card, (state) => {
                        sendCardById(state, selectedId, "Hand");
                    });
                }
            );
        },
    },
} satisfies TrapCard;
