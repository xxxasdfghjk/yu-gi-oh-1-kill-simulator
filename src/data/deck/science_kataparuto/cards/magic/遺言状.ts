import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
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
                
                // Each Last Will activation allows one use per monster sent to graveyard
                let usesRemaining = state.monstersToGraveyardThisTurn.length;
                
                // Create deck effect
                const deckEffect = {
                    id: effectId,
                    name: `${card.card.card_name}の効果`,
                    canActivate: () => {
                        // Check if monsters were sent to graveyard this turn
                        return usesRemaining > 0 && 
                               state.monstersToGraveyardThisTurn.length > 0 &&
                               new CardSelector(state).deck().filter().monster().hasAttackBelow(1500).len() > 0;
                    },
                    activate: () => {
                        if (usesRemaining <= 0) return;
                        
                        import("@/utils/effectUtils").then(({ withUserSelectCard, withUserSummon }) => {
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
                                            usesRemaining--;
                                            if (usesRemaining <= 0) {
                                                // Remove this effect from deck effects
                                                state.deckEffects = state.deckEffects.filter(e => e.id !== effectId);
                                            }
                                        }
                                    );
                                }
                            );
                        });
                    }
                };
                
                // Add to deck effects
                state.deckEffects.push(deckEffect);
            },
        },
    },
} satisfies MagicCard;
