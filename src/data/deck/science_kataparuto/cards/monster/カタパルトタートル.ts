import type { LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { sendCard } from "@/utils/cardMovement";
import { withLifeChange, withUserSelectCard } from "@/utils/effectUtils";
import { getAttack } from "@/utils/gameUtils";

export default {
    card_name: "カタパルト・タートル",
    card_type: "モンスター" as const,
    text: "自分フィールド上のモンスター１体をリリースして発動できる。 リリースしたモンスターの攻撃力の半分のダメージを相手ライフに与える。",
    image: "card100095993_1.jpg",
    monster_type: "効果モンスター",
    level: 5,
    element: "水" as const,
    race: "水" as const,
    attack: 1000,
    defense: 2000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                // Check if this card is on the field and if there are monsters to tribute
                if (card.location !== "MonsterField") return false;
                if (card.position !== "attack" && card.position === "defense") return false;
                // Check turn once restriction
                const monsters = new CardSelector(state).allMonster().filter().nonNull().get();
                return monsters.length > 0;
            },
            effect: (state, card) => {
                // Select a monster to tribute
                withUserSelectCard(
                    state,
                    card,
                    (state) => new CardSelector(state).allMonster().filter().nonNull().get(),
                    {
                        select: "single",
                        canCancel: true,
                        message: "リリースするモンスターを選択",
                    },
                    (state, card, selected) => {
                        const tributedMonster = selected[0];
                        // Calculate damage (half of tributed monster's attack)
                        const damage = Math.floor(getAttack(tributedMonster) / 2);
                        // Send the selected monster to graveyard
                        sendCard(state, tributedMonster, "Graveyard");

                        // Deal damage to opponent
                        withLifeChange(state, card, {
                            target: "opponent",
                            amount: damage,
                            operation: "decrease",
                        });
                    }
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
