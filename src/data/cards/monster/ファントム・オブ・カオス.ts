import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import type { CardInstance, LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
const effect = {
    onSummon: (state: GameStore, card: CardInstance) => {
        const monstersInGraveyard = (state: GameStore) => new CardSelector(state).graveyard().filter().monster().get();

        if (monstersInGraveyard.length > 0) {
            withUserSelectCard(
                state,
                card,
                monstersInGraveyard,
                {
                    select: "single",
                    message: "コピーするモンスターを選択してください",
                },
                (state, card, selected) => {
                    if (selected.length > 0) {
                        const targetMonster = selected[0];
                        sendCard(state, targetMonster, "Exclusion");
                        for (let i = 0; i < 5; i++) {
                            if (state.field.monsterZones[i]?.id === card.id) {
                                state.field.monsterZones[i] = {
                                    ...state.field.monsterZones[i]!,
                                    card: { ...state.field.monsterZones[i]!.card, effect: targetMonster?.card.effect },
                                };
                            }
                        }
                    }
                }
            );
        }
    },
};
export default {
    card_name: "ファントム・オブ・カオス",
    card_type: "モンスター" as const,
    text: "①：このカードが召喚・特殊召喚に成功した場合に発動できる。自分の墓地のモンスター１体を除外し、このカードの元々の攻撃力・守備力をそのモンスターと同じにし、そのモンスターの効果を得る。",
    image: "card100188699_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "悪魔" as const,
    attack: 0,
    defense: 0,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    originEffect: effect,
    effect,
} satisfies LeveledMonsterCard;
