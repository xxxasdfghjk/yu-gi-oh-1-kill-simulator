import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withUserSummon,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
} from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { getLevel } from "@/utils/gameUtils";
import { monsterFilter } from "@/utils/cardManagement";
import { CardInstanceFilter } from "@/utils/CardInstanceFilter";
import type { XyzMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "虚空海竜リヴァイエール",
    card_type: "モンスター" as const,
    text: "レベル３モンスター×２\n１ターンに１度、このカードのエクシーズ素材を１つ取り除く事で、ゲームから除外されている自分または相手のレベル４以下のモンスター１体を選択して自分フィールド上に特殊召喚する。",
    image: "card100314678_1.jpg",
    monster_type: "エクシーズモンスター",
    element: "風" as const,
    race: "水" as const,
    attack: 1800,
    defense: 1600,
    hasDefense: true as const,
    hasLevel: false as const,
    hasRank: true as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    rank: 3,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state, card) => {
                        // X素材が1つ以上あることを確認
                        if (card.materials.length === 0) return false;

                        // 除外されているレベル4以下のモンスターがあるかチェック
                        const exiledMonsters = new CardSelector(state)
                            .banished()
                            .filter()
                            .monster()
                            .underLevel(4)
                            .get();
                        return exiledMonsters.length > 0;
                    },
                    "Leviair_Effect",
                    true
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // X素材を1つ選択して取り除く
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

                                    // 除外されているレベル4以下のモンスターを検索
                                    const exiledMonsters = (state: GameStore) =>
                                        new CardSelector(state).banished().filter().monster().underLevel(4).get();

                                    withUserSelectCard(
                                        state,
                                        card,
                                        exiledMonsters,
                                        {
                                            select: "single",
                                            message: "特殊召喚するレベル4以下のモンスターを選択してください",
                                        },
                                        (state, card, selected) => {
                                            if (selected.length > 0) {
                                                withUserSummon(
                                                    state,
                                                    card,
                                                    selected[0],
                                                    {
                                                        canSelectPosition: true,
                                                        optionPosition: ["attack", "defense"],
                                                    },
                                                    () => {}
                                                );
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    },
                    "Leviair_Effect",
                    true
                );
            },
        },
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card) && card.card.hasLevel && getLevel(card) === 3;
    },
    materialCondition: (cards) => {
        return cards.length === 2 && new CardInstanceFilter(cards).level(3).len() === 2;
    },
} satisfies XyzMonsterCard;
