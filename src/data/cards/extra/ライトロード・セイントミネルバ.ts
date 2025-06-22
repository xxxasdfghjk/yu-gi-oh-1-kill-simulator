import {
    withUserSelectCard,
    withDraw,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withSendToGraveyardFromDeckTop,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getLevel } from "@/utils/gameUtils";
import { monsterFilter } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";
import type { XyzMonsterCard } from "@/types/card";

export default {
    card_name: "ライトロード・セイント ミネルバ",
    card_type: "モンスター" as const,
    text: "レベル４モンスター×２\nこのカード名の①②の効果はそれぞれ１ターンに１度しか使用できない。①：このカードのX素材を１つ取り除いて発動できる。自分のデッキの上からカードを３枚墓地へ送る。その中に「ライトロード」カードがあった場合、さらにその数だけ自分はドローする。②：このカードが戦闘または相手の効果で破壊された場合に発動できる。自分のデッキの上からカードを３枚墓地へ送る。その中に「ライトロード」カードがあった場合、さらにその数までフィールドのカードを破壊できる。",
    image: "card100022987_1.jpg",
    monster_type: "エクシーズモンスター",
    element: "光" as const,
    race: "天使" as const,
    attack: 2000,
    defense: 800,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    rank: 4,
    effect: {
        // ①の効果：X素材を1つ取り除いて発動
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (_state, card) => {
                        return card.materials.length > 0 && card.location === "MonsterField";
                    },
                    "LightlordSaintMinerva_Effect1"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // X素材を選択して取り除く
                        if (card.materials.length > 0) {
                            withUserSelectCard(
                                state,
                                card,
                                () => card.materials,
                                {
                                    select: "single",
                                    message: "墓地に送るX素材を1つ選択してください",
                                },
                                (state, card, selected) => {
                                    if (selected.length > 0) {
                                        // 選択した素材を取り除く
                                        const selectedMaterial = selected[0];
                                        card.materials = card.materials.filter((m) => m.id !== selectedMaterial.id);
                                        sendCard(state, selectedMaterial, "Graveyard");

                                        // デッキの上から3枚墓地に送り、「ライトロード」カードをカウント
                                        const cardsToMill = Math.min(3, state.deck.length);
                                        const lightLoadCount = state.deck
                                            .slice(0, cardsToMill)
                                            .filter((e) => e.card.card_name.includes("ライトロード")).length;
                                        withSendToGraveyardFromDeckTop(state, card, cardsToMill, (state, card) => {
                                            withDraw(state, card, { count: lightLoadCount });
                                        });
                                    }
                                }
                            );
                        }
                    },
                    "LightlordSaintMinerva_Effect1"
                );
            },
        },

        // ②の効果は破壊時トリガーのため実装しない
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card) && card.card.hasLevel && getLevel(card) === 4;
    },
    materialCondition: (cards) => {
        return cards.length === 2 && new CardInstanceFilter(cards).level(4).len() === 2;
    },
} satisfies XyzMonsterCard;
