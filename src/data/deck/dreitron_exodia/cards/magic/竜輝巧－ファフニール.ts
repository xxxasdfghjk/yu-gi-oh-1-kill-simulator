import type { MagicCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { isMagicCard, isTrapCard } from "@/utils/cardManagement";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

const card = {
    card_name: "竜輝巧－ファフニール",
    card_type: "魔法" as const,
    magic_type: "フィールド魔法" as const,
    text: "このカード名のカードは１ターンに１枚しか発動できない。①：このカードの発動時の効果処理として、デッキから「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カード１枚を手札に加える事ができる。②：儀式魔法カードの効果の発動及びその発動した効果は無効化されない。③：１ターンに１度、自分フィールドに「ドライトロン」モンスターが存在する状態で、モンスターが表側表示で召喚・特殊召喚された場合に発動できる。このターン、その表側表示モンスターのレベルは、その攻撃力１０００につき１つ下がる（最小１まで）。",
    image: "card100206543_1.jpg",
    effect: {
        onSpell: {
            condition: (state, card) =>
                withTurnAtOneceCondition(state, card, (state) => {
                    const draitronSpellTrap = state.deck.filter(
                        (e) =>
                            (isMagicCard(e.card) || isTrapCard(e.card)) &&
                            e.card.card_name.includes("竜輝巧") &&
                            e.card.card_name !== "竜輝巧－ファフニール"
                    );
                    return draitronSpellTrap.length > 0;
                }),
            effect: (state, card) =>
                withTurnAtOneceEffect(state, card, () => {
                    const draitronSpellTrap = (state: GameStore) =>
                        state.deck.filter(
                            (e) =>
                                (isMagicCard(e.card) || isTrapCard(e.card)) &&
                                e.card.card_name.includes("竜輝巧") &&
                                e.card.card_name !== "竜輝巧－ファフニール"
                        );
                    withUserSelectCard(
                        state,
                        card,
                        draitronSpellTrap,
                        {
                            select: "single",
                            message: "デッキから手札に加えるドライトロン魔法・罠カードを選択してください",
                        },
                        (state, _cardInstance, selected) => {
                            sendCard(state, selected[0], "Hand");
                        }
                    );
                }),
        },
    },
} satisfies MagicCard;

export default card;
