import type { GameStore } from "@/store/gameStore";
import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { v4 as uuidv4 } from "uuid";

export default {
    card_name: "遺言状",
    card_type: "魔法" as const,
    text: "このターンに墓地へ送られたモンスター１体の代わりに、デッキから攻撃力１５００以下のモンスター１体をフィールド上に出すことができる。",
    image: "card100222242_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: () => true,
            effect: (state, card) => {
                // Create a unique effect for this activation
                const effectId = uuidv4();
                // Create deck effect
                const deckEffect = {
                    id: effectId,
                    name: `${card.card.card_name}の効果`,
                    card: card,
                    canActivate: (state: GameStore) => {
                        // Check if monsters were sent to graveyard this turn
                        const monstersThisTurn = state.monstersToGraveyardThisTurn.length;
                        const availableTargets = new CardSelector(state).deck().filter().monster().hasAttackBelow(1500).len();
                        console.log("Last Will canActivate check:", {
                            monstersThisTurn,
                            availableTargets,
                            result: monstersThisTurn > 0 && availableTargets > 0
                        });
                        return (
                            monstersThisTurn > 0 && availableTargets > 0
                        );
                    },
                    activate: (state: GameStore) => {
                        withUserSelectCard(
                            state,
                            card,
                            (state) => new CardSelector(state).deck().filter().monster().hasAttackBelow(1500).get(),
                            {
                                select: "single",
                                canCancel: true,
                                message: "特殊召喚するモンスターを選択（攻撃力1500以下）",
                            },
                            (state, card, selected) => {
                                withUserSummon(
                                    state,
                                    card,
                                    selected[0],
                                    {
                                        canSelectPosition: true,
                                        optionPosition: ["attack", "defense"],
                                    },
                                    () => {
                                        state.deckEffects = state.deckEffects.filter((e) => e.id !== effectId);
                                    }
                                );
                            }
                        );
                    },
                };

                // Add to deck effects
                console.log("Adding Last Will deck effect:", deckEffect);
                state.deckEffects.push(deckEffect);
                console.log("Current deck effects:", state.deckEffects);
            },
        },
    },
} satisfies MagicCard;
