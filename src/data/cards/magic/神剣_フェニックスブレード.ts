import type { MagicCard } from "@/types/card";
import { withExclusionMonsters, withUserSelectCard } from "@/utils/effectUtils";
import { sendCard, equipCard, addBuf } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { monsterFilter } from "@/utils/cardManagement";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "神剣-フェニックス・ブレード",
    card_type: "魔法" as const,
    text: "戦士族のみ装備可能。装備モンスターの攻撃力は３００ポイントアップする。このカードが自分のメインフェイズ時に自分の墓地に存在する時、自分の墓地の戦士族モンスター２体をゲームから除外する事でこのカードを手札に加える。",
    image: "card73705517_1.jpg",
    magic_type: "装備魔法" as const,
    effect: {
        onSpell: {
            condition: (state) => {
                // フィールドに戦士族モンスターが存在するか確認
                const warriors = new CardSelector(state).allMonster().filter().race("戦士").get();
                return warriors.length > 0;
            },
            effect: (state, card) => {
                // 戦士族モンスターを選択して装備
                const warriorMonsters = (state: GameStore) =>
                    new CardSelector(state).allMonster().filter().race("戦士").get();

                withUserSelectCard(
                    state,
                    card,
                    warriorMonsters,
                    {
                        select: "single",
                        message: "装備する戦士族モンスターを選択してください",
                        canCancel: false,
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            const target = selected[0];
                            // 装備
                            equipCard(state, target, card);
                            // 攻撃力+300
                            addBuf(state, card, { attack: 300, defense: 0, level: 0 });
                        }
                    }
                );
            },
        },
        onIgnition: {
            condition: (state, card) => {
                // 墓地に存在し、メインフェイズ中で、墓地に戦士族モンスターが2体以上いる
                if (card.location !== "Graveyard" || state.phase !== "main1") {
                    return false;
                }
                const graveyardWarriors = state.graveyard.filter(
                    (c) => monsterFilter(c.card) && c.card.race === "戦士"
                );
                return graveyardWarriors.length >= 2;
            },
            effect: (state, card) => {
                // 墓地の戦士族モンスター2体を選択して除外
                const graveyardWarriors = (state: GameStore) =>
                    new CardSelector(state).graveyard().filter().race("戦士").get();

                withUserSelectCard(
                    state,
                    card,
                    graveyardWarriors,
                    {
                        select: "multi",
                        condition: (cards) => cards.length === 2,
                        message: "除外する戦士族モンスター2体を選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        // 選択したモンスターを除外
                        withExclusionMonsters(state, card, { cardIdList: selected.map((e) => e.id) }, (state, card) => {
                            sendCard(state, card, "Hand");
                        });
                    }
                );
            },
        },
    },
} satisfies MagicCard;
