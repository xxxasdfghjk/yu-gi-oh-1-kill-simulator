import type { MagicCard } from "@/types/card";
import { releaseCard, sendCard, summon } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withDelay } from "@/utils/effectUtils";
import { monsterFilter } from "@/utils/cardManagement";
import { getPrioritySetMonsterZoneIndex } from "@/utils/gameUtils";
import type { GameStore } from "@/store/gameStore";
import type { CardInstance } from "@/types/card";

export default {
    card_name: "モンスターゲート",
    card_type: "魔法" as const,
    text: "自分フィールド上のモンスター１体を生け贄に捧げる。通常召喚可能なモンスターが出るまで自分のデッキをめくり、そのモンスターを特殊召喚する。他のめくったカードは全て墓地に送る。",
    image: "card1000621_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: (state: GameStore) => {
                // 自分フィールドにモンスターが存在するかチェック
                return (
                    new CardSelector(state).allMonster().filter().nonNull().len() > 0 &&
                    new CardSelector(state).deck().filter().canNormalSummon().len() > 0
                );
            },
            effect: (state: GameStore, card: CardInstance) => {
                // リリースするモンスターを選択
                withUserSelectCard(
                    state,
                    card,
                    (state: GameStore) => new CardSelector(state).allMonster().filter().nonNull().get(),
                    {
                        select: "single",
                        message: "リリースするモンスターを1体選んでください",
                    },
                    (state: GameStore, card: CardInstance, selected: CardInstance[]) => {
                        // 選択したモンスターをリリース
                        releaseCard(state, selected[0]);

                        // デッキから通常召喚可能なモンスターを探す
                        let foundMonsterId: string | null = null;
                        const sentToGraveIds: string[] = [];

                        // デッキを上から確認
                        for (const deckCard of state.deck) {
                            // 通常召喚可能なモンスターかチェック
                            if (monsterFilter(deckCard.card) && deckCard.card.canNormalSummon !== false) {
                                foundMonsterId = deckCard.id;
                                break;
                            } else {
                                sentToGraveIds.push(deckCard.id);
                            }
                        }

                        withDelay(state, card, { delay: 100, order: -100 }, (state, card) => {});
                        // めくったカードを墓地へ送る
                        sentToGraveIds.forEach((cardId) => {
                            const targetCard = state.deck.find((c) => c.id === cardId);
                            if (targetCard) {
                                sendCard(state, targetCard, "Graveyard");
                            }
                        });

                        // モンスターが見つかった場合、特殊召喚
                        if (foundMonsterId) {
                            withDelay(state, card, { delay: 500, order: 0 }, (state) => {
                                const monsterToSummon = state.deck.find((c) => c.id === foundMonsterId);
                                if (monsterToSummon) {
                                    const zoneIndex = getPrioritySetMonsterZoneIndex(state, false);
                                    if (zoneIndex !== -1) {
                                        summon(state, monsterToSummon, zoneIndex, "attack");
                                    }
                                }
                            });
                        }
                    }
                );
            },
        },
    },
} satisfies MagicCard;
