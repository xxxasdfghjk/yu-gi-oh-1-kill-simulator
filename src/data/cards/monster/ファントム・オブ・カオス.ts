import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ファントム・オブ・カオス",
    card_type: "モンスター" as const,
    text: "①：このカードが召喚・特殊召喚に成功した場合に発動できる。自分の墓地のモンスター１体を除外し、このカードの元々の攻撃力・守備力をそのモンスターと同じにし、そのモンスターの効果を得る。",
    image: "card100188699_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "悪魔族" as const,
    attack: 0,
    defense: 0,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onSummon: (state, card) => {
            const monstersInGraveyard = new CardSelector(state).graveyard().filter().monster().get();

            if (monstersInGraveyard.length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    () => monstersInGraveyard,
                    {
                        select: "single",
                        message: "コピーするモンスターを選択してください",
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            const targetMonster = selected[0];

                            // モンスターを除外
                            sendCard(state, targetMonster, "Exclusion");

                            // 攻撃力・守備力をコピー
                            if (targetMonster.card.hasDefense) {
                                card.buf.attack = targetMonster.card.attack;
                                card.buf.defense = targetMonster.card.defense;
                            } else {
                                card.buf.attack = targetMonster.card.attack;
                            }

                            // 効果をコピー（簡略化：元々の効果を保持）
                            // 実際の実装では完全な効果コピーが必要
                        }
                    }
                );
            }
        },
    },
};
