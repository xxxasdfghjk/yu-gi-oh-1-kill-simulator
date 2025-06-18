import type { MagicCard } from "@/types/card";
import { withUserSelectCard, withDraw, withDelay } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "デステニー・ドロー",
    card_type: "魔法" as const,
    text: "手札から「Ｄ−ＨＥＲＯ」と名のついたカード１枚を捨てる。自分のデッキからカードを２枚ドローする。",
    image: "card100039152_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // 手札にD-HEROが存在し、デッキに2枚以上カードがあるか確認
                const dHeroes = new CardSelector(state).hand().filter().include("D-HERO").get();

                return dHeroes.length > 0 && state.deck.length >= 2;
            },
            payCost: (state, card, afterCallback) => {
                // 手札からD-HEROを選択してコストとして捨てる
                const dHeroes = (state: GameStore) => new CardSelector(state).hand().filter().include("D-HERO").get();

                withUserSelectCard(
                    state,
                    card,
                    dHeroes,
                    {
                        select: "single",
                        message: "捨てるD-HEROを選択してください",
                        canCancel: false,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            // 選択したD-HEROを墓地へ送る
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
                withDraw(state, card, { count: 2 }, (state, card) => {
                    resolve?.(state, card);
                });
            },
        },
    },
} satisfies MagicCard;
