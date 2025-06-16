import type { MagicCard } from "@/types/card";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { sendCard, equipCard, getEquipTarget } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "D・D・R",
    card_type: "魔法" as const,
    text: "手札を１枚捨てる。ゲームから除外されている自分のモンスター１体を選択して攻撃表示でフィールド上に特殊召喚し、このカードを装備する。このカードがフィールド上から離れた時、そのモンスターを破壊する。",
    image: "card73705533_1.jpg",
    magic_type: "装備魔法" as const,
    effect: {
        onSpell: {
            // 手札が1枚以上あり、除外ゾーンにモンスターがいることが条件
            condition: (state, card) => {
                const handCards = new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();
                const banishedMonsters = new CardSelector(state).banished().filter().noSummonLimited().get();
                return handCards.length > 0 && banishedMonsters.length > 0;
            },
            // コスト：手札を1枚捨てる
            payCost: (state, card, afterCallback) => {
                const handCards = (state: GameStore) =>
                    new CardSelector(state).hand().filter().excludeId(card.id).nonNull().get();

                withUserSelectCard(
                    state,
                    card,
                    handCards,
                    {
                        select: "single",
                        condition: (selected) => selected.length === 1,
                        message: "手札を1枚捨ててください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            // 手札を墓地へ送る
                            sendCard(state, selected[0], "Graveyard");
                            // コスト支払い後の処理を実行
                            afterCallback(state, card);
                        }
                    }
                );
            },
            effect: (state, card) => {
                // 除外ゾーンのモンスターを選択
                const banishedMonsters = (state: GameStore) =>
                    new CardSelector(state).banished().filter().noSummonLimited().get();

                withUserSelectCard(
                    state,
                    card,
                    banishedMonsters,
                    {
                        select: "single",
                        condition: (selected) => selected.length === 1,
                        message: "除外されているモンスターを1体選んでください",
                        canCancel: false,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            const targetMonster = selected[0];

                            // モンスターを攻撃表示で特殊召喚
                            withUserSummon(
                                state,
                                card,
                                targetMonster,
                                {
                                    canSelectPosition: false,
                                    optionPosition: ["attack"], // 攻撃表示固定
                                },
                                (state, card, summonedMonster) => {
                                    // このカードを装備
                                    equipCard(state, summonedMonster, card);
                                }
                            );
                        }
                    }
                );
            },
        },
        // フィールドから離れた時の効果
        onLeaveField: (state, card) => {
            // 装備されているモンスターを探す
            const equipTarget = getEquipTarget(state, card);
            if (equipTarget) {
                // 装備モンスターを破壊
                sendCard(state, equipTarget, "Graveyard");
            }
        },
    },
} satisfies MagicCard;
