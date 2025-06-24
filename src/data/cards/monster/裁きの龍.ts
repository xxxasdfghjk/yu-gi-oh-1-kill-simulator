import { CardSelector } from "@/utils/CardSelector";
import { withUserSummon, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { destroyByEffect } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import { hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "裁きの龍",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できない。自分の墓地に「ライトロード」と名のついたモンスターカードが４種類以上存在する場合のみ特殊召喚する事ができる。１０００ライフポイントを払う事で、このカードを除くフィールド上のカードを全て破壊する。このカードが自分フィールド上に表側表示で存在する場合、自分のエンドフェイズ毎に、自分のデッキの上からカードを４枚墓地に送る。",
    image: "card73708044_1.jpg",
    monster_type: "効果モンスター",
    level: 8,
    element: "光" as const,
    race: "ドラゴン" as const,
    attack: 3000,
    defense: 2600,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        // 特殊召喚効果
        onIgnition: {
            condition: (state, card) => {
                if (card.location === "Hand") {
                    // 手札から特殊召喚：墓地に「ライトロード」モンスター4種類以上
                    const graveyardLightlordMonsters = new CardSelector(state)
                        .graveyard()
                        .filter()
                        .monster()
                        .lightsworn()
                        .get();

                    // カード名の種類をカウント
                    const uniqueLightlordNames = new Set(graveyardLightlordMonsters.map((c) => c.card.card_name));

                    return uniqueLightlordNames.size >= 4 && hasEmptyMonsterZone(state);
                } else if (card.location === "MonsterField") {
                    // フィールドから起動：1ターンに1度、LPコスト支払い可能
                    return withTurnAtOneceCondition(
                        state,
                        card,
                        (state) => state.lifePoints >= 1000,
                        "JudgmentDragon_Destroy"
                    );
                }
                return false;
            },
            effect: (state, card) => {
                if (card.location === "Hand") {
                    // 手札から特殊召喚
                    withUserSummon(
                        state,
                        card,
                        card,
                        {
                            canSelectPosition: true,
                            optionPosition: ["attack", "defense"],
                        },
                        () => {}
                    );
                } else if (card.location === "MonsterField") {
                    // フィールド上のカード破壊効果
                    withTurnAtOneceEffect(
                        state,
                        card,
                        (state, card) => {
                            // 1000LP支払い
                            state.lifePoints -= 1000;

                            // このカードを除くフィールド上のカードを全て破壊
                            const allFieldCards = [
                                ...new CardSelector(state).allMonster().filter().nonNull().get(),
                                ...new CardSelector(state).spellTrap().filter().nonNull().get(),
                                ...new CardSelector(state).field().filter().nonNull().get(),
                            ].filter((c) => c.id !== card.id); // 自身を除外

                            // 全て破壊
                            allFieldCards.forEach((targetCard) => {
                                destroyByEffect(state, targetCard);
                            });
                        },
                        "JudgmentDragon_Destroy"
                    );
                }
            },
        },

        // エンドフェイズ時の効果は実装しない（TODO）
    },
    summonLimited: true,
} satisfies LeveledMonsterCard;
