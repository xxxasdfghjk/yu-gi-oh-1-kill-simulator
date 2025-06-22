import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withTurnAtOneceCondition, withTurnAtOneceEffect } from "@/utils/effectUtils";
import { addBuf, sendCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { getLevel } from "@/utils/gameUtils";

export default {
    card_name: "トワイライトロード・ジェネラル ジェイン",
    card_type: "モンスター" as const,
    text: "①：１ターンに１度、自分の手札・墓地から「ライトロード」モンスター１体を除外し、フィールドの表側表示モンスター１体を対象として発動できる。そのモンスターの攻撃力・守備力はターン終了時まで、除外したモンスターのレベル×３００ダウンする。②：１ターンに１度、このカード以外の自分の「ライトロード」モンスターの効果が発動した場合に発動する。自分のデッキの上からカードを２枚墓地へ送る。",
    image: "card100051817_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "闇" as const,
    race: "戦士" as const,
    attack: 1800,
    defense: 1200,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const lightroadInHandGrave = new CardSelector(state)
                            .hand()
                            .graveyard()
                            .filter()
                            .include("ライトロード")
                            .get();

                        const banishedLightroad = new CardSelector(state)
                            .banished()
                            .filter()
                            .include("ライトロード")
                            .get();

                        return (
                            lightroadInHandGrave.length > 0 &&
                            banishedLightroad.length > 0 &&
                            card.location === "MonsterField"
                        );
                    },
                    "TwilightGeneral_Ignition"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const lightroadInHandGrave = (state: GameStore) =>
                            new CardSelector(state).hand().graveyard().filter().include("ライトロード").get();

                        withUserSelectCard(
                            state,
                            card,
                            lightroadInHandGrave,
                            {
                                select: "single",
                                message: "除外する「ライトロード」モンスターを選択してください",
                            },
                            (state, card, selected) => {
                                sendCard(state, selected[0], "Exclusion");
                                const level = getLevel(selected[0]);
                                const target = (state: GameStore) => new CardSelector(state).allMonster().getNonNull();

                                withUserSelectCard(
                                    state,
                                    card,
                                    target,
                                    {
                                        select: "single",
                                        message: "攻撃力・守備力を下げるモンスターを選択してください",
                                    },
                                    (state, _card, selected2) => {
                                        if (selected2.length > 0) {
                                            addBuf(state, selected2[0], {
                                                attack: -300 * level,
                                                defense: -300 * level,
                                                level: 0,
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    },
                    "TwilightGeneral_Ignition"
                );
            },
        },
        //TODO
    },
} satisfies LeveledMonsterCard;
