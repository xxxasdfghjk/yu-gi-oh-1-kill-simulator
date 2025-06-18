import type { MagicCard } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelayRecursive } from "@/utils/effectUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

export default {
    card_name: "魔法再生",
    card_type: "魔法" as const,
    text: "手札の魔法カードを２枚墓地に送る。自分の墓地から魔法カードを１枚選択し、手札に加える。",
    image: "card100001453_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore, card: CardInstance) => {
                // 手札に自身以外の魔法カードが2枚以上あるかチェック
                const handMagicCards = new CardSelector(state).hand().filter().magic().excludeId(card.id).len();

                // 墓地に魔法カードがあるかチェック
                const graveyardMagicCards = new CardSelector(state).graveyard().filter().magic().len();

                return handMagicCards >= 2 && graveyardMagicCards > 0;
            },
            payCost: (state, card, after) => {
                const id = card.id;
                withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).hand().filter().magic().excludeId(id).get(),
                    {
                        select: "multi",
                        condition: (list) => list.length === 2,
                        message: "手札から墓地に送る魔法カードを2枚選んでください",
                        canCancel: true,
                    },
                    (state, card, discardCards) => {
                        withDelayRecursive(
                            state,
                            card,
                            { delay: 100, order: -1 },
                            discardCards.length,
                            (state, _card, depth) => {
                                sendCard(state, discardCards[depth - 1], "Graveyard");
                            },
                            (state, card) => {
                                after(state, card);
                            }
                        );
                    }
                );
            },
            effect: (state: GameStore, card: CardInstance, _, resolve) => {
                // 手札から魔法カード2枚を選択
                withUserSelectCard(
                    state,
                    card,
                    (state: GameStore) => new CardSelector(state).graveyard().filter().magic().get(),
                    {
                        select: "single",
                        message: "墓地から手札に加える魔法カードを1枚選んでください",
                    },
                    (state: GameStore, card: CardInstance, selected: CardInstance[]) => {
                        sendCard(state, selected[0], "Hand");
                        resolve?.(state, card);
                    }
                );
            },
        },
    },
} satisfies MagicCard;
