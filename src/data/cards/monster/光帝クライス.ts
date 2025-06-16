import type { LeveledMonsterCard } from "@/types/card";
import { withUserSelectCard, withDraw, withDelayRecursive, withOption } from "@/utils/effectUtils";
import { CardSelector } from "@/utils/CardSelector";
import { sendCardById } from "@/utils/cardMovement";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "光帝クライス",
    card_type: "モンスター" as const,
    text: "このカードが召喚・特殊召喚に成功した時、フィールド上に存在するカードを２枚まで破壊する事ができる。破壊されたカードのコントローラーはデッキから破壊された枚数分のカードをドローする事ができる。このカードは召喚・特殊召喚したターンには攻撃する事ができない。",
    image: "card1002300_1.jpg",
    monster_type: "効果モンスター",
    level: 6,
    element: "光" as const,
    race: "戦士" as const,
    attack: 2400,
    defense: 1000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onSummon: (state, card) => {
            // フィールド上のカードを取得（モンスター、魔法・罠、フィールドゾーン）
            const fieldCards = (state: GameStore) =>
                new CardSelector(state).allMonster().allFieldSpellTrap().getNonNull();

            if (fieldCards.length > 0) {
                withUserSelectCard(
                    state,
                    card,
                    fieldCards,
                    {
                        select: "multi",
                        condition: (cards) => cards.length >= 1 && cards.length <= 2,
                        message: "破壊するカードを2枚まで選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        const destroyCount = selected.length;

                        const idList = selected.map((e) => e.id);
                        // カードを破壊
                        withDelayRecursive(
                            state,
                            card,
                            {},
                            destroyCount,
                            (state, _, depth) => {
                                sendCardById(state, idList[depth - 1], "Graveyard");
                            },
                            (state, card) => {
                                // 任意効果なので、ドローするかどうかをユーザーに選択させる
                                withOption(
                                    state,
                                    card,
                                    [
                                        {
                                            name: "ドローしない",
                                            condition: () => true,
                                        },
                                        {
                                            name: `${destroyCount}枚ドローする`,
                                            condition: () => true,
                                        },
                                    ],
                                    (state, card, option) => {
                                        if (option === `${destroyCount}枚ドローする`) {
                                            withDraw(state, card, { count: destroyCount });
                                        }
                                        // "ドローしない"が選択された場合は何もしない
                                    }
                                );
                            }
                        );
                    }
                );
            }
        },
    },
} satisfies LeveledMonsterCard;
