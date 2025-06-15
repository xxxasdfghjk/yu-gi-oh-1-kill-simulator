import type { MagicCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withLifeChange, withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { equipCard } from "@/utils/cardMovement";

export default {
    card_name: "早すぎた埋葬",
    card_type: "魔法" as const,
    text: "８００ライフポイントを払う。自分の墓地からモンスターカードを１体選んで攻撃表示でフィールド上に出し、このカードを装備する。このカードが破壊された時、装備モンスターを破壊する。",
    image: "card100040257_1.jpg",
    magic_type: "装備魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                return state.lifePoints >= 800 && new CardSelector(state).graveyard().filter().monster().len() > 0;
            },
            effect: (state, card) => {
                // Pay 800 life points first
                withLifeChange(
                    state,
                    card,
                    {
                        target: "player",
                        amount: 800,
                        operation: "decrease",
                    },
                    (state, card) => {
                        // Select monster from graveyard
                        withUserSelectCard(
                            state,
                            card,
                            (state) => new CardSelector(state).graveyard().filter().monster().get(),
                            {
                                select: "single",
                                canCancel: false,
                                message: "墓地から特殊召喚するモンスターを選択",
                            },
                            (state, card, selected) => {
                                const selectedMonster = selected[0];

                                // Special summon in attack position
                                withUserSummon(
                                    state,
                                    card,
                                    selectedMonster,
                                    {
                                        canSelectPosition: false,
                                        optionPosition: ["attack"],
                                    },
                                    (state, card, monster) => {
                                        // Find the summoned monster by searching for the selected monster

                                        // Search in monster zones
                                        equipCard(state, monster, card);

                                        // Store reference for mutual destruction
                                    }
                                );
                            }
                        );
                    }
                );
            },
        },
        // When this card leaves the field, destroy the equipped monster
        onLeaveField: (state, card) => {
            // Check if this card is being destroyed because the equipped monster was destroyed
            // to prevent infinite loops
            const isEquipmentDestruction = card.location !== "SpellField";

            if ((card as any).prematureBurialTarget && !isEquipmentDestruction) {
                // Find the equipped monster
                const targetId = (card as any).prematureBurialTarget;
                let targetMonster = null;

                // Search in monster zones
                for (let i = 0; i < state.field.monsterZones.length; i++) {
                    if (state.field.monsterZones[i]?.id === targetId) {
                        targetMonster = state.field.monsterZones[i];
                        break;
                    }
                }

                // Search in extra monster zones
                if (!targetMonster) {
                    for (let i = 0; i < state.field.extraMonsterZones.length; i++) {
                        if (state.field.extraMonsterZones[i]?.id === targetId) {
                            targetMonster = state.field.extraMonsterZones[i];
                            break;
                        }
                    }
                }

                // Destroy the target monster if found
                if (targetMonster) {
                    import("@/utils/cardMovement").then(({ sendCard }) => {
                        sendCard(state, targetMonster, "Graveyard");
                    });
                }
            }

            // Remove the card normally
            import("@/utils/cardMovement").then(({ sendCard }) => {
                sendCard(state, card, "Graveyard", { ignoreLeavingInstead: true });
            });
        },
    },
} satisfies MagicCard;
