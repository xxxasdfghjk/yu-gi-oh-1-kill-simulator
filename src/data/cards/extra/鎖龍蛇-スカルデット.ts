import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withDraw,
    withSendDeckBottom,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withOption,
} from "@/utils/effectUtils";
import { monsterFilter } from "@/utils/cardManagement";
import type { LinkMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { calcCanSummonLink, getCardInstanceFromId, hasEmptyMonsterZone } from "@/utils/gameUtils";

export default {
    card_name: "鎖龍蛇-スカルデット",
    card_type: "モンスター" as const,
    text: "カード名が異なるモンスター２体以上\n①：このカードは、このカードのL素材としたモンスターの数によって以下の効果を得る。●２体以上：このカードのリンク先にモンスターが召喚・特殊召喚された場合に発動する。そのモンスターの攻撃力・守備力は３００アップする。●３体以上：１ターンに１度、自分メインフェイズに発動できる。手札からモンスター１体を特殊召喚する。●４体：このカードがL召喚した時に発動できる。自分は４枚ドローする。その後、自分の手札を３枚選んで好きな順番でデッキの下に戻す。",
    image: "card100322910_1.jpg",
    monster_type: "リンクモンスター",
    link: 4,
    linkDirection: ["上", "左下", "下", "右下"] as const,
    element: "地" as const,
    race: "ドラゴン" as const,
    attack: 2800,
    hasDefense: false as const,
    hasLevel: false as const,
    hasRank: false as const,
    hasLink: true as const,
    canNormalSummon: false as const,
    effect: {
        // ●４体効果：リンク召喚時に4枚ドロー、3枚デッキ下に戻す
        onSummon: (state, card) => {
            if (card.summonedBy === "Link") {
                const materialCount = card.summonedByMaterials?.length || 0;

                if (materialCount >= 4) {
                    if (state.deck.length < 4) {
                        return;
                    }
                    withOption(
                        state,
                        card,
                        [{ name: "自分は４枚ドローする", condition: () => true }],
                        (state, card) => {
                            withDraw(state, card, { count: 4 }, (state, card) => {
                                const handCards = (state: GameStore) => new CardSelector(state).hand().getNonNull();
                                const currentHand = handCards(state);

                                if (currentHand.length >= 3) {
                                    withUserSelectCard(
                                        state,
                                        card,
                                        handCards,
                                        {
                                            select: "multi",
                                            condition: (select) => select.length === 3,
                                            message: "デッキの下に戻す手札を3枚選択してください",
                                        },
                                        (state, card, selected) => {
                                            if (selected.length === 3) {
                                                // 選択した3枚のIDを取得
                                                const selectedIds = selected.map((c) => c.id);
                                                withSendDeckBottom(state, card, selectedIds);
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    );
                }
            }
        },

        // ●３体以上効果：1ターンに1度、手札からモンスター1体を特殊召喚
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        const materialCount = card.summonedByMaterials?.length || 0;
                        const isMainPhase = state.phase === "main1" || state.phase === "main2";
                        const handMonsters = new CardSelector(state).hand().filter().monster().get();
                        return (
                            materialCount >= 3 &&
                            isMainPhase &&
                            handMonsters.length > 0 &&
                            card.location === "MonsterField" &&
                            hasEmptyMonsterZone(state)
                        );
                    },
                    card.id,
                    true
                );
            },
            effect: (state, card) => {
                const handMonsters = (state: GameStore) =>
                    new CardSelector(state).hand().filter().monster().noSummonLimited().get();

                withUserSelectCard(
                    state,
                    card,
                    handMonsters,
                    {
                        select: "single",
                        message: "特殊召喚するモンスターを選択してください",
                        canCancel: true,
                    },
                    (state, card, selected) => {
                        const selectedId = selected[0].id;
                        withTurnAtOneceEffect(
                            state,
                            card,
                            (state, card) => {
                                if (selected.length > 0) {
                                    const selected = getCardInstanceFromId(state, selectedId)!;
                                    withUserSummon(
                                        state,
                                        card,
                                        selected,
                                        {
                                            canSelectPosition: true,
                                            optionPosition: ["attack", "defense"],
                                        },
                                        () => {}
                                    );
                                }
                            },
                            card.id,
                            true
                        );
                    }
                );
            },
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card);
    },
    materialCondition: (cards) => {
        // カード名が異なるモンスター2体以上
        const uniqueNames = new Set(cards.map((c) => c.card.card_name));

        return uniqueNames.size === cards.length && cards.length >= 2 && calcCanSummonLink(cards).includes(4);
    },
} satisfies LinkMonsterCard;
