import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCardById } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";
import { shuffleDeck } from "@/utils/gameUtils";

export default {
    card_name: "壱世壊に奏でる哀唱",
    card_type: "罠" as const,
    text: "このカード名の(1)(2)の効果はそれぞれ１ターンに１度しか使用できない。(1)：自分フィールドに「ティアラメンツ」モンスターまたは「ヴィサス＝スタフロスト」が存在する場合、相手フィールドの効果モンスター１体を対象として発動できる。そのモンスターの効果を無効にする。その後、自分フィールドのモンスター１体を選んで墓地へ送る。(2)：このカードが効果で墓地へ送られた場合に発動できる。デッキから「ティアラメンツ」モンスター１体を手札に加える。",
    image: "card100260564_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onAnywhereToGraveyardByEffect: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true)) {
                return;
            }

            if (new CardSelector(state).deck().filter().monster().include("ティアラメンツ").len() === 0) {
                return;
            }
            withUserSelectCard(
                state,
                card,
                (state) => {
                    return new CardSelector(state).deck().filter().monster().include("ティアラメンツ").get();
                },
                { select: "single", canCancel: true },
                (state, card, selected) => {
                    const selectedId = selected[0].id;
                    withTurnAtOneceEffect(state, card, (state) => {
                        sendCardById(state, selectedId, "Hand");
                        shuffleDeck(state);
                    });
                }
            );
        },
    },
} satisfies TrapCard;
