import type { LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withOption, withLifeChange } from "@/utils/effectUtils";
import { addBuf, sendCard } from "@/utils/cardMovement";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "ラーの翼神竜",
    card_type: "モンスター" as const,
    text: "このカードは特殊召喚できない。このカードを通常召喚する場合、３体をリリースして召喚しなければならない。①：このカードの召喚は無効化されない。②：このカードの召喚成功時には、このカード以外の魔法・罠・モンスターの効果は発動できない。③：このカードが召喚に成功した時、１００LPになるようにLPを払って発動できる。このカードの攻撃力・守備力は払った数値分アップする。④：１０００LPを払い、フィールドのモンスター１体を対象として発動できる。そのモンスターを破壊する。",
    image: "card100019991_1.jpg",
    monster_type: "効果モンスター",
    element: "神" as const,
    race: "幻神獣" as const,
    attack: 0,
    defense: 0,
    level: 10,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onSummon: (state, card) => {
            // 召喚成功時、100LPになるようにLPを払って攻撃力・守備力をアップする効果を選択可能
            withOption(
                state,
                card,
                [
                    {
                        name: "LPを支払い、攻撃力・守備力をアップする",
                        condition: () => state.lifePoints > 100,
                    },
                    {
                        name: "何もしない",
                        condition: () => true,
                    },
                ],
                (state, card, option) => {
                    if (option === "LPを支払い、攻撃力・守備力をアップする" && state.lifePoints > 100) {
                        const paidLP = state.lifePoints - 100;
                        withLifeChange(
                            state,
                            card,
                            {
                                target: "player",
                                amount: paidLP,
                                operation: "decrease",
                            },
                            (state, card) => {
                                addBuf(state, card, { attack: paidLP, defense: paidLP, level: 0 });
                            }
                        );
                    }
                },
                true
            );
        },
        onIgnition: {
            condition: (state, card) => {
                const allFieldMonsters = (state: GameStore) =>
                    new CardSelector(state).allMonster().filter().nonNull().get();

                return state.lifePoints >= 1000 && allFieldMonsters.length > 0 && card.location === "MonsterField";
            },
            effect: (state, card) => {
                withLifeChange(
                    state,
                    card,
                    {
                        target: "player",
                        amount: 1000,
                        operation: "decrease",
                    },
                    (state, card) => {
                        withUserSelectCard(
                            state,
                            card,
                            (state: GameStore) => new CardSelector(state).allMonster().filter().nonNull().get(),

                            {
                                select: "single",
                                message: "破壊するモンスターを選択してください",
                            },
                            (state, _card, selected) => {
                                if (selected.length > 0) {
                                    sendCard(state, selected[0], "Graveyard");
                                }
                            }
                        );
                    }
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
