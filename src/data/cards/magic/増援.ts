import type { MagicCard } from "@/types/card";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { monsterFilter } from "@/utils/cardManagement";
import { getLevel, shuffleDeck } from "@/utils/gameUtils";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "増援",
    card_type: "魔法" as const,
    text: "デッキからレベル４以下の戦士族モンスター１体を手札に入れ、デッキをシャッフルする。",
    image: "card100002425_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // デッキにレベル4以下の戦士族モンスターが存在するか確認
                const warriors = state.deck.filter(
                    (c) => monsterFilter(c.card) && c.card.race === "戦士" && getLevel(c) <= 4
                );
                return warriors.length > 0;
            },
            effect: (state, card, _, resolve) => {
                // デッキからレベル4以下の戦士族モンスターを取得
                const warriorMonsters = (state: GameStore) =>
                    new CardSelector(state).deck().filter().race("戦士").underLevel(4).get();

                withUserSelectCard(
                    state,
                    card,
                    warriorMonsters,
                    {
                        select: "single",
                        message: "手札に加える戦士族モンスターを選択してください",
                        canCancel: false,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            sendCard(state, selected[0], "Hand");
                        }
                        shuffleDeck(state);
                        resolve?.(state, card);
                    }
                );
            },
        },
    },
} satisfies MagicCard;
