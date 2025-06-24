import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withTurnAtOneceCondition } from "@/utils/effectUtils";
import { getCardInstanceFromId, hasEmptyMonsterZone } from "@/utils/gameUtils";
import { withUserSummon } from "../../../utils/effectUtils";

export default {
    card_name: "粉砕せし破壊神",
    card_type: "魔法" as const,
    text: "このカード名の①②の効果はそれぞれ１ターンに１度しか使用できず、その発動と効果は無効化されない。 ①：自分の手札・墓地から「オベリスクの巨神兵」１体を選んで特殊召喚する。 この効果で特殊召喚したモンスターはこのターン、相手の効果を受けない。 ②：自分フィールドに「オベリスクの巨神兵」が存在する状態で、自分のカードの効果を発動するために、自分フィールドのモンスター２体以上を同時にリリースした場合、墓地のこのカードを除外して発動できる。 相手の墓地のモンスターを全て除外し、その数×５００ダメージを相手に与える。",
    image: "card100278147_1.jpg",
    magic_type: "速攻魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(state, card, (state) => {
                    return (
                        new CardSelector(state).graveyard().hand().filter().include("オベリスクの巨神兵").len() > 0 &&
                        hasEmptyMonsterZone(state)
                    );
                }),
            effect: (state, card, _, resolve) => {
                const oberisk = new CardSelector(state)
                    .graveyard()
                    .hand()
                    .filter()
                    .include("オベリスクの巨神兵")
                    .get()
                    .at(0);
                if (oberisk === undefined) {
                    resolve?.(state, card);
                    return;
                }
                const cardId = card.id;
                withUserSummon(state, card, oberisk, {}, (state) => {
                    const magicCard = getCardInstanceFromId(state, cardId)!;
                    resolve?.(state, magicCard);
                });
            },
        },
    },
} satisfies MagicCard;
