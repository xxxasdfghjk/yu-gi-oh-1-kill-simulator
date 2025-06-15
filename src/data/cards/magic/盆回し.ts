import type { CardInstance, MagicCard } from "@/types/card";
import { isMagicCard } from "@/utils/cardManagement";
import { sendCard, sendCardById } from "@/utils/cardMovement";
import { withUserSelectCard, withDelay } from "@/utils/effectUtils";

export default {
    card_name: "盆回し",
    card_type: "魔法" as const,
    magic_type: "速攻魔法" as const,
    text: "①：自分のデッキからカード名が異なるフィールド魔法カード2枚を選び、その内の1枚を自分フィールドにセットし、もう1枚を相手フィールドにセットする。この効果でセットしたカードのいずれかがフィールドゾーンにセットされている限り、お互いに他のフィールド魔法カードを発動・セットできない。",
    image: "card100046458_1.jpg",
    effect: {
        onSpell: {
            condition: (state) => {
                const fieldSpells = state.deck.filter(
                    (e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法"
                );
                // Check if we have at least 2 different field spell names
                const uniqueNames = new Set(fieldSpells.map((e) => e.card.card_name));
                return uniqueNames.size >= 2;
            },
            effect: (state, card) => {
                // Group by card name and select up to 2 different names
                // User selects which field spell to set on their own field zone
                withUserSelectCard(
                    state,
                    card,
                    (state) =>
                        state.deck
                            .filter((e) => isMagicCard(e.card) && e.card.magic_type === "フィールド魔法")
                            .reduce<CardInstance[]>(
                                (prev, cur) =>
                                    prev.find((e) => e.card.card_name === cur.card.card_name) ? prev : [...prev, cur],
                                []
                            ),
                    {
                        select: "multi",
                        condition: (cards) => cards.length === 2,
                        message: "デッキから異なるフィールド魔法カード2枚を選択してください",
                    },
                    (state, _cardInstance, selectedList) => {
                        const selectedListId = selectedList.map((e) => e.id);
                        withUserSelectCard(
                            state,
                            _cardInstance,
                            (state) => selectedListId.map((id) => state.deck.find((c) => c.id === id)!),
                            {
                                select: "single",
                                message: "自分のフィールドゾーンにセットするフィールド魔法カードを選択してください",
                            },
                            (state, _, selected) => {
                                if (state.field.fieldZone !== null) {
                                    sendCard(state, state.field.fieldZone, "Graveyard");
                                }
                                const otherCard = selectedListId.find((c) => c !== selected[0].id)!;

                                sendCardById(state, otherCard, "OpponentField", { reverse: true });

                                // Extract the ID before withDelay to avoid proxy error
                                const selectedCardId = selected[0].id;

                                withDelay(state, _, { order: 0 }, (state) => {
                                    sendCardById(state, selectedCardId, "FieldZone", { reverse: true });
                                    state.isFieldSpellActivationAllowed = selectedCardId;
                                });
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies MagicCard;
