import type { LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { sendCard } from "@/utils/cardMovement";
import { withLifeChange, withOption, withUserSelectCard } from "@/utils/effectUtils";

export default {
    card_name: "トゥーン・キャノン・ソルジャー",
    card_type: "モンスター" as const,
    text: "召喚ターンには攻撃不可。「トゥーン・ワールド」が破壊された時このカードも破壊。自分のフィールド上に「トゥーン・ワールド」があり相手がトゥーンをコントロールしていない場合このカードは相手を直接攻撃できる。自分のフィールド上モンスター１体を生け贄に捧げる度に、相手に５００ライフポイントのダメージを与える。",
    image: "card100022029_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "機械" as const,
    attack: 1400,
    defense: 1300,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                // Check if there are other monsters on the field to tribute (excluding this card)
                const monsters = new CardSelector(state).allMonster().filter().nonNull().get();
                return monsters.length > 0 && card.location === "MonsterField";
            },
            effect: (state, card) => {
                withOption(
                    state,
                    card,
                    [
                        {
                            name: "モンスターをリリースして500ダメージ",
                            condition: () => true,
                        },
                    ],
                    (state, card) => {
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
                                // Send the selected monster to graveyard
                                sendCard(state, selected[0], "Graveyard");

                                // Deal 500 damage to opponent
                                withLifeChange(state, card, {
                                    target: "opponent",
                                    amount: 500,
                                    operation: "decrease",
                                });
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
