import type { CardInstance, LeveledMonsterCard } from "@/types/card";
import { CardSelector } from "@/utils/CardSelector";
import {
    withLifeChange,
    withNotification,
    withReleaseMonsters,
    withUserSelectCard,
    withUserSummon,
} from "@/utils/effectUtils";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "D-HERO ドグマガイ",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できない。自分フィールド上に存在する「Ｄ−ＨＥＲＯ」と名のついたモンスターを含むモンスタ−３体を生け贄に捧げた場合のみ特殊召喚する事ができる。この特殊召喚に成功した場合、次の相手ターンのスタンバイフェイズ時に相手ライフを半分にする。",
    image: "card100039260_1.jpg",
    monster_type: "効果モンスター",
    level: 8,
    element: "闇" as const,
    race: "戦士" as const,
    attack: 3400,
    defense: 2400,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    summonLimited: true,
    effect: {
        // 特殊召喚成功時の効果
        onIgnition: {
            condition: (state, card) => {
                return (
                    card.location === "Hand" &&
                    state.field.monsterZones.filter((m) => m?.card.card_name.includes("D-HERO")).length >= 1 &&
                    new CardSelector(state).allMonster().filter().nonNull().get().length >= 3
                );
            },
            effect: (state, card) => {
                const releaseCard = (state: GameStore) => new CardSelector(state).allMonster().getNonNull();

                withUserSelectCard(
                    state,
                    card,
                    releaseCard,
                    {
                        select: "multi",
                        condition: (cards: CardInstance[]) => {
                            return (
                                cards.length == 3 &&
                                cards.filter((c) => c.card.card_name.includes("D-HERO")).length >= 1
                            );
                        },
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        withReleaseMonsters(state, card, { cardIdList: selected.map((e) => e.id) }, (state, card) => {
                            withUserSummon(state, card, card, {}, () => {});
                        });
                    }
                );
            },
        },
        onStandbyPhase: (state, card) => {
            // 相手ターンのスタンバイフェイズまで待機
            // 現在このゲームは1ターンのみなので、次のフェイズで即座に発動
            withNotification(
                state,
                card,
                {
                    message: "D-HERO ドグマガイの効果！相手のライフポイントを半分に！",
                },
                (state, card) => {
                    // 相手のライフポイントを半分にする
                    const currentLP = state.opponentLifePoints;
                    const damage = Math.floor(currentLP / 2);

                    // withLifeChangeを使用してライフポイントを減少
                    withLifeChange(state, card, {
                        target: "opponent",
                        amount: damage,
                        operation: "decrease",
                    });
                }
            );
        },
    },
} satisfies LeveledMonsterCard;
