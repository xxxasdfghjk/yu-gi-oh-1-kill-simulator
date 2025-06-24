import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceEffect,
    withLifeChange,
    withTurnAtOneceCondition,
} from "@/utils/effectUtils";
import { addBuf } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getAttack, getDefense, hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "Emトリック・クラウン",
    card_type: "モンスター" as const,
    text: "このカード名の効果は１ターンに１度しか使用できない。①：このカードが墓地へ送られた場合、自分の墓地の「Em」モンスター１体を対象として発動できる。そのモンスターを特殊召喚する。この効果で特殊召喚したモンスターの攻撃力・守備力は０になる。その後、自分は１０００ダメージを受ける。",
    image: "card100180167_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "魔法使い" as const,
    attack: 1600,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onAnywhereToGraveyard: (state, card) => {
            if (!withTurnAtOneceCondition(state, card, () => true)) {
                return;
            }
            if (!hasEmptyMonsterZone(state)) {
                return;
            }
            const emMonsters = (state: GameStore) =>
                new CardSelector(state).graveyard().filter().monster().include("Em").get();
            if (emMonsters(state).length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    emMonsters,
                    {
                        select: "single",
                        message: "特殊召喚する「Em」モンスターを選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            withTurnAtOneceEffect(state, card, (state, card) => {
                                withUserSummon(
                                    state,
                                    card,
                                    selected[0],
                                    {
                                        canSelectPosition: true,
                                        optionPosition: ["attack", "defense"],
                                    },
                                    (state, card, monster) => {
                                        addBuf(state, monster, {
                                            attack: -getAttack(monster),
                                            defense: -getDefense(monster),
                                            level: 0,
                                        });
                                        withLifeChange(
                                            state,
                                            card,
                                            { target: "player", amount: 1000, operation: "decrease" },
                                            () => {}
                                        );
                                        // 特殊召喚完了
                                    }
                                );
                            });
                        }
                    }
                );
            }
        },
    },
} satisfies LeveledMonsterCard;
