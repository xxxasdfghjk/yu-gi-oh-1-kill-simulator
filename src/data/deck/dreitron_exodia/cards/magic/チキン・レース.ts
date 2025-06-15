import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";
import { sendCard } from "@/utils/cardMovement";
import { withTurnAtOneceCondition, withTurnAtOneceEffect, withOption } from "@/utils/effectUtils";
import { shuffleDeck } from "@/utils/gameUtils";

export default {
    card_name: "チキンレース",
    card_type: "魔法" as const,
    magic_type: "フィールド魔法" as const,
    text: "①：このカードがフィールドゾーンに存在する限り、相手よりＬＰが少ないプレイヤーが受ける全てのダメージは０になる。②：お互いのプレイヤーは１ターンに１度、自分メインフェイズに１０００ＬＰを払って以下の効果から１つを選択して発動できる。この効果の発動に対して、お互いは魔法・罠・モンスターの効果を発動できない。●デッキから１枚ドローする。●このカードを破壊する。●相手は１０００ＬＰ回復する。",
    image: "card100022942_1.jpg",
    effect: {
        onSpell: {
            condition: () => true,
            effect: () => true,
        },
        onIgnition: {
            condition: (state: GameStore, card: CardInstance) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) =>
                        (state.field.fieldZone?.id === card.id || state.opponentField.fieldZone?.id === card.id) &&
                        state.lifePoints >= 1000
                );
                // Check if card is in field zone and player has enough LP
            },
            effect: (state: GameStore, card: CardInstance) => {
                withTurnAtOneceEffect(state, card, (state, card) => {
                    // Pay 1000 LP
                    state.lifePoints -= 1000;

                    // Choose one of three effects
                    withOption(
                        state,
                        card,
                        [
                            {
                                name: "デッキから１枚ドローする",
                                condition: () => state.deck.length > 0,
                            },
                            {
                                name: "このカードを破壊する",
                                condition: () => true,
                            },
                            {
                                name: "相手は１０００ＬＰ回復する",
                                condition: () => true,
                            },
                        ],
                        (state, card, option) => {
                            switch (option) {
                                case "デッキから１枚ドローする":
                                    if (state.deck.length > 0) {
                                        shuffleDeck(state);
                                        const drawnCard = state.deck[0];
                                        sendCard(state, drawnCard, "Hand");
                                    }
                                    break;
                                case "このカードを破壊する":
                                    sendCard(state, card, "Graveyard");
                                    break;
                                case "相手は１０００ＬＰ回復する":
                                    // In a 1-turn game, we'll just ignore opponent LP recovery
                                    break;
                            }
                        }
                    );
                });
            },
        },
    },
};
