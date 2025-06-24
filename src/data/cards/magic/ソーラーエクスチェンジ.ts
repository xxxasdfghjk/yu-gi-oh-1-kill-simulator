import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDraw, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { MagicCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "ソーラー・エクスチェンジ",
    card_type: "魔法" as const,
    text: "手札から「ライトロード」と名のついたモンスターカード１枚を捨てて発動する。自分のデッキからカードを２枚ドローし、その後デッキの上からカードを２枚墓地に送る。",
    image: "card1002391_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                const lightlordInHand = new CardSelector(state).hand().filter().monster().lightsworn().get();
                return lightlordInHand.length > 0 && state.deck.length >= 4;
            },
            payCost: (state, card, afterCallback) => {
                const lightlordInHand = (state: GameStore) =>
                    new CardSelector(state).hand().filter().monster().lightsworn().get();

                withUserSelectCard(
                    state,
                    card,
                    lightlordInHand,
                    {
                        select: "single",
                        message: "捨てる「ライトロード」モンスターを選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            sendCard(state, selected[0], "Graveyard");
                        }
                        afterCallback(state, card);
                    }
                );
            },
            effect: (state, card, _context, resolve) => {
                // 2枚ドロー
                withDraw(state, card, { count: 2 }, (state, card) => {
                    // デッキの上から2枚墓地に送る
                    withDelayRecursive(
                        state,
                        card,
                        { delay: 100 },
                        2,
                        (state) => {
                            sendCard(state, state.deck[0], "Graveyard");
                        },
                        (state, card) => {
                            if (resolve) resolve(state, card);
                        }
                    );
                });
            },
        },
    },
} satisfies MagicCard;
