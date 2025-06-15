import type { MagicCard } from "@/types/card";
import { hasLevelMonsterFilter, isMagicCard } from "@/utils/cardManagement";
import { sendCard } from "@/utils/cardMovement";
import { withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "儀式の準備",
    card_type: "魔法" as const,
    magic_type: "通常魔法" as const,
    text: "デッキからレベル７以下の儀式モンスター１体を手札に加える。その後、自分の墓地から儀式魔法カード１枚を選んで手札に加える事ができる。",
    image: "card100123678_1.jpg",
    effect: {
        onSpell: {
            condition: (state) =>
                state.deck.filter(
                    (e) =>
                        hasLevelMonsterFilter(e.card) && e.card.monster_type === "儀式モンスター" && e.card.level <= 7
                ).length > 0,
            effect: (state, card) =>
                withUserSelectCard(
                    state,
                    card,
                    (state) =>
                        state.deck.filter(
                            (e) =>
                                hasLevelMonsterFilter(e.card) &&
                                e.card.monster_type === "儀式モンスター" &&
                                e.card.level <= 7
                        ),
                    {
                        select: "single",
                        message: "デッキから手札に加えるレベル7以下の儀式モンスターを選択してください",
                    },
                    (state, _cardInstance, selected) => {
                        sendCard(state, selected[0], "Hand");
                        // Check if there are ritual spell cards in graveyard
                        const ritualSpells = state.graveyard.filter(
                            (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                        );
                        if (ritualSpells.length > 0) {
                            withUserSelectCard(
                                state,
                                _cardInstance,
                                (state) =>
                                    state.graveyard.filter(
                                        (e) => isMagicCard(e.card) && e.card.magic_type === "儀式魔法"
                                    ),
                                {
                                    select: "single",
                                    message: "墓地から手札に加える儀式魔法カードを選択してください",
                                },
                                (state, _cardInstance, selected) => {
                                    sendCard(state, selected[0], "Hand");
                                }
                            );
                        }
                    }
                ),
        },
    },
} satisfies MagicCard;
