import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceEffect,
    withOption,
    withExclusionMonsters,
    withTurnAtOneceCondition,
} from "@/utils/effectUtils";
import type { FusionMonsterCard } from "@/types/card";

export default {
    card_name: "神光の龍",
    card_type: "モンスター" as const,
    text: "「裁きの龍」＋「戒めの龍」 自分のフィールド及び墓地からそれぞれ１体ずつ、上記のカードを除外した場合のみ特殊召喚できる。 ①：自分・相手ターンに１度、２０００ＬＰを払って発動できる。 このカード以外のお互いのフィールド・墓地のカードを全て除外する。 ②：自分エンドフェイズに発動する。 自分のデッキの上からカードを４枚墓地へ送る。 ③：このカードが相手によって破壊された場合に発動できる。 自分の除外状態の「裁きの龍」「戒めの龍」を１体ずつ手札に加える。 その後、その２体を召喚条件を無視して特殊召喚できる。",
    image: "card100325766_1.jpg",
    monster_type: "融合モンスター",
    level: 10,
    element: "光" as const,
    race: "ドラゴン" as const,
    attack: 3000,
    defense: 3000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    filterAvailableMaterials: () => false,
    materialCondition: () => false,
    summonLimited: true,
    effect: {
        // 特殊召喚条件：フィールドと墓地から裁きの龍・戒めの龍を1体ずつ除外
        onIgnition: {
            condition: (state, card) => {
                if (card.location === "ExtraDeck") {
                    const judgementField = new CardSelector(state).allMonster().filter().include("裁きの龍").len() > 0;
                    const admonitionField = new CardSelector(state).allMonster().filter().include("戒めの龍").len() > 0;
                    const judgementGraveyard =
                        new CardSelector(state).graveyard().filter().include("裁きの龍").len() > 0;
                    const admonitionGraveyard =
                        new CardSelector(state).graveyard().filter().include("戒めの龍").len() > 0;
                    return (judgementField && admonitionGraveyard) || (judgementGraveyard && admonitionField);
                } else if (card.location === "MonsterField") {
                    return withTurnAtOneceCondition(
                        state,
                        card,
                        (state, card) => {
                            return (
                                new CardSelector(state)
                                    .allFieldSpellTrap()
                                    .allMonster()
                                    .graveyard()
                                    .filter()
                                    .excludeId(card.id)
                                    .len() > 0 && state.lifePoints > 2000
                            );
                        },
                        card.id,
                        true
                    );
                }
                return false;
            },
            effect: (state, card) => {
                if (card.location === "ExtraDeck") {
                    withUserSelectCard(
                        state,
                        card,
                        (state) => new CardSelector(state).allMonster().graveyard().getNonNull(),
                        {
                            select: "single",
                            message: "除外するカードを選択してください",
                            condition: (cardList) => {
                                if (cardList.length !== 2) {
                                    return false;
                                }
                                const judge = cardList.find((e) => e.card.card_name === "裁きの龍");
                                const admonition = cardList.find((e) => e.card.card_name === "戒めの龍");
                                return !!judge && !!admonition && judge.location !== admonition.location;
                            },
                        },
                        (state, card, selected) => {
                            // 両方を除外
                            withExclusionMonsters(
                                state,
                                card,
                                { cardIdList: selected.map((e) => e.id) },
                                (state, card) => {
                                    withUserSummon(
                                        state,
                                        card,
                                        card,
                                        {
                                            canSelectPosition: false,
                                            optionPosition: ["attack"],
                                        },
                                        () => {}
                                    );
                                }
                            );
                        }
                    );
                } else if (card.location === "MonsterField") {
                    withOption(
                        state,
                        card,
                        [
                            {
                                name: "2000LPを払ってフィールドと墓地のカードを全て除外",
                                condition: () => state.lifePoints >= 2000,
                            },
                        ],
                        (state, card, option) => {
                            if (option === "2000LPを払ってフィールドと墓地のカードを全て除外") {
                                withTurnAtOneceEffect(
                                    state,
                                    card,
                                    (state, card) => {
                                        // 2000LP払う
                                        state.lifePoints -= 2000;
                                        // このカード以外の全てのフィールドと墓地のカードを除外
                                        const cardsToExclude = [
                                            ...new CardSelector(state)
                                                .allMonster()
                                                .allFieldSpellTrap()
                                                .graveyard()
                                                .filter()
                                                .nonNull()
                                                .excludeId(card.id)
                                                .get(),
                                        ];
                                        withExclusionMonsters(
                                            state,
                                            card,
                                            { cardIdList: cardsToExclude.map((e) => e.id) },
                                            () => {}
                                        );
                                    },
                                    "DivineLightDragon_Banish",
                                    true
                                );
                            }
                        },
                        true
                    );
                }
            },
        },
    },
} satisfies FusionMonsterCard;
