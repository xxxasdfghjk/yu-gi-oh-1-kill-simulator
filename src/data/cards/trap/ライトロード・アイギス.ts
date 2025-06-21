import { withOption } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { TrapCard } from "@/types/card";
import { hasEmptySpellField } from "@/utils/cardManagement";

export default {
    card_name: "ライトロード・アイギス",
    card_type: "罠" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：自分フィールドの「ライトロード」モンスターの数まで、相手フィールドの表側表示カードを対象として発動できる。そのカードの効果をターン終了時まで無効にする。②：このカードがデッキから墓地へ送られた場合に発動できる。このカードを自分フィールドにセットする。",
    image: "card100325940_1.jpg",
    trap_type: "通常罠" as const,
    effect: {
        onAnywhereToGraveyard: (state, card) => {
            if (!hasEmptySpellField(state)) {
                return;
            }
            withOption(
                state,
                card,
                [
                    { name: "セットする", condition: () => true },
                    { name: "セットしない", condition: () => true },
                ],
                (state, card, option) => {
                    if (option === "セットする") sendCard(state, card, "SpellField", { reverse: true });
                }
            );
        },
    },
} satisfies TrapCard;
