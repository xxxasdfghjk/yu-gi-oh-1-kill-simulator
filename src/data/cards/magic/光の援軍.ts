import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { hasLevelMonsterFilter } from "@/utils/cardManagement";
import type { MagicCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "光の援軍",
    card_type: "魔法" as const,
    text: "自分のデッキの上からカードを３枚墓地へ送って発動する。自分のデッキからレベル４以下の「ライトロード」と名のついたモンスター１体を手札に加える。",
    image: "card100015416_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                const lightlordInDeck = new CardSelector(state)
                    .deck()
                    .getNonNull()
                    .filter(
                        (c) =>
                            c.card.card_name.includes("ライトロード") &&
                            c.card.card_type === "モンスター" &&
                            hasLevelMonsterFilter(c.card) &&
                            c.card.level <= 4
                    );
                return state.deck.length >= 3 && lightlordInDeck.length > 0;
            },
            payCost: (state, card, after) => {
                withDelayRecursive(
                    state,
                    card,
                    { delay: 100 },
                    3,
                    (state) => {
                        if (state.deck.length > 0) {
                            sendCard(state, state.deck[0], "Graveyard");
                        }
                    },
                    (state, card) => after(state, card)
                );
            },
            effect: (state, card, context, resolve) => {
                const lightlordInDeck = (state: GameStore) =>
                    new CardSelector(state)
                        .deck()
                        .getNonNull()
                        .filter(
                            (c) =>
                                c.card.card_name.includes("ライトロード") &&
                                c.card.card_type === "モンスター" &&
                                hasLevelMonsterFilter(c.card) &&
                                c.card.level <= 4
                        );

                if (lightlordInDeck.length > 0) {
                    withUserSelectCard(
                        state,
                        card,
                        lightlordInDeck,
                        {
                            select: "single",
                            message: "手札に加える「ライトロード」モンスターを選択してください",
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                sendCard(state, selected[0], "Hand");
                            }
                            if (resolve) resolve(state, card);
                        }
                    );
                } else {
                    if (resolve) resolve(state, card);
                }
            },
        },
    },
} satisfies MagicCard;
