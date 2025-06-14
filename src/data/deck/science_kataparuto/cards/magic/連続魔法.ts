import type { MagicCard } from "@/types/card";
import { hasEmptySpellField, isMagicCard } from "../../../../../utils/cardManagement";
import { CardSelector } from "@/utils/CardSelector";

export default {
    card_name: "連続魔法",
    card_type: "魔法" as const,
    text: "自分の通常魔法発動時に発動する事ができる。手札を全て墓地に捨てる。このカードの効果は、その通常魔法の効果と同じになる。",
    image: "card100016548_1.jpg",
    magic_type: "速攻魔法" as const,
    effect: {
        onSpell: {
            condition: (state, card) => {
                const chainCardList = state.cardChain.filter((e) => e.id !== card.id);
                if (chainCardList.length === 0) {
                    return false;
                }
                return (
                    isMagicCard(chainCardList[0].card) &&
                    chainCardList[0].card.magic_type === "通常魔法" &&
                    (card.location === "Hand" || (card.location === "SpellField" && card.position === "back")) &&
                    new CardSelector(state).hand().filter().excludeId(card.id).len() > 0 &&
                    (hasEmptySpellField(state) || card.location === "SpellField")
                );
            },
            effect: (state, card) => {
                const chainCard = state.cardChain.filter((e) => e.id !== card.id).at(0);
                chainCard?.card?.effect?.onSpell?.effect?.(state, card);
            },
        },
        onChain: {
            condition: (state, card) => {
                const chainCardList = state.cardChain.filter((e) => e.id !== card.id);
                if (chainCardList.length === 0) {
                    return false;
                }

                return (
                    isMagicCard(chainCardList[0].card) &&
                    chainCardList[0].card.magic_type === "通常魔法" &&
                    (card.location === "Hand" || (card.location === "SpellField" && card.position === "back")) &&
                    new CardSelector(state).hand().filter().excludeId(card.id).len() > 0 &&
                    (hasEmptySpellField(state) || card.location === "SpellField")
                );
            },
        },
    },
} satisfies MagicCard;
