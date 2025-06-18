import type { MagicCard } from "@/types/card";
import { withUserSelectCard, withDraw, withDelay } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { monsterFilter } from "@/utils/cardManagement";
import { getLevel } from "@/utils/gameUtils";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "トレード・イン",
    card_type: "魔法" as const,
    text: "手札からレベル８のモンスターカードを１枚捨てる。自分のデッキからカードを２枚ドローする。",
    image: "card100098273_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // 手札にレベル8モンスターが存在し、デッキに2枚以上カードがあるか確認
                const level8Monsters = state.hand.filter((c) => monsterFilter(c.card) && getLevel(c) === 8);
                return level8Monsters.length > 0 && state.deck.length >= 2;
            },
            payCost: (state, card, afterCallback) => {
                // 手札からレベル8モンスターを選択してコストとして捨てる
                const level8Monsters = (state: GameStore) => new CardSelector(state).hand().filter().level(8).get();

                withUserSelectCard(
                    state,
                    card,
                    level8Monsters,
                    {
                        select: "single",
                        message: "捨てるレベル8モンスターを選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            // 選択したモンスターを墓地へ送る
                            sendCard(state, selected[0], "Graveyard");
                            withDelay(state, card, { delay: 100 }, (state, card) => {
                                afterCallback(state, card);
                            });
                        }
                    }
                );
            },
            effect: (state, card, _, resolve) => {
                // 2枚ドロー
                withDraw(state, card, { count: 2 });
                resolve?.(state, card);
            },
        },
    },
} satisfies MagicCard;
