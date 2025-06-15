import type { MagicCard } from "@/types/card";
import { monsterFilter } from "@/utils/cardManagement";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

const card = {
    card_name: "極超の竜輝巧",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない。①：デッキから「ドライトロン」モンスター１体を特殊召喚する。この効果で特殊召喚したモンスターはエンドフェイズに破壊される。",
    image: "card100206552_1.jpg",
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(
                    state,
                    card,
                    (state) =>
                        state.deck.filter((e) => monsterFilter(e.card) && e.card.card_name.includes("竜輝巧")).length >
                            0 && hasEmptyMonsterZone(state)
                ),
            effect: (state, card) =>
                withTurnAtOneceEffect(state, card, () => {
                    withUserSelectCard(
                        state,
                        card,
                        (state) =>
                            state.deck.filter((e) => monsterFilter(e.card) && e.card.card_name.includes("竜輝巧")),
                        {
                            select: "single",
                            message: "デッキから特殊召喚するドライトロンモンスターを選択してください",
                        },
                        (state, _cardInstance, selected) => {
                            withUserSummon(state, _cardInstance, selected[0], {}, () => {});
                        }
                    );
                }),
        },
    },
} satisfies MagicCard;

export default card;
