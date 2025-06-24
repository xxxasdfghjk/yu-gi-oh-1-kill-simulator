import { CardSelector } from "@/utils/CardSelector";
import {
    withUserSelectCard,
    withTurnAtOneceCondition,
    withTurnAtOneceEffect,
    withSendToGraveyardFromDeckTop,
    withSendToGraveyard,
    withExclusionMonsters,
} from "@/utils/effectUtils";
import type { SynchroMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";
import { monsterFilter } from "@/utils/cardManagement";
import { sumLevel } from "@/utils/cardManagement";
import { shuffleDeck } from "@/utils/gameUtils";

export default {
    card_name: "ライトロード・アテナ ミネルバ",
    card_type: "モンスター" as const,
    text: "チューナー＋チューナー以外のモンスター１体以上\nこのカード名の①③の効果はそれぞれ１ターンに１度しか使用できない。①：このカードがS召喚した場合に発動できる。そのS素材とした「ライトロード」モンスターの数まで、デッキから「ライトロード」モンスターを墓地へ送る（同じ種族は１体まで）。②：自分フィールドの「ライトロード」モンスターは効果では除外できない。③：自分の墓地から「ライトロード」モンスターを４体まで除外して発動できる。除外した数だけ自分のデッキの上からカードを墓地へ送る。",
    image: "card100325742_1.jpg",
    monster_type: "シンクロモンスター",
    element: "光" as const,
    race: "天使" as const,
    attack: 2800,
    defense: 1800,
    level: 8,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        // ①の効果：S召喚時効果
        onSummon: (state, card) => {
            if (card.summonedBy === "Synchro") {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        // S素材とした「ライトロード」モンスターの数を計算（簡略化：materials配列から推定）
                        const lightlordMaterialCount =
                            card.summonedByMaterials?.filter((m) => m.card_name.includes("ライトロード")).length ?? 0;

                        if (lightlordMaterialCount > 0) {
                            // デッキから「ライトロード」モンスターを墓地へ送る（同じ種族は1体まで）
                            const lightlordMonstersInDeck = (state: GameStore) =>
                                new CardSelector(state)
                                    .deck()
                                    .filter()
                                    .monster()
                                    .include("ライトロード")
                                    .unique()
                                    .get();

                            withUserSelectCard(
                                state,
                                card,
                                lightlordMonstersInDeck,
                                {
                                    select: "multi",
                                    message: `デッキから「ライトロード」モンスターを${lightlordMaterialCount}体まで選択して墓地に送る（同じ種族は1体まで）`,
                                    condition: (cards) => cards.length <= lightlordMaterialCount,
                                },
                                (state, _card, selected) => {
                                    withSendToGraveyard(
                                        state,
                                        _card,
                                        selected,
                                        (state) => {
                                            shuffleDeck(state);
                                        },
                                        { byEffect: true }
                                    );
                                }
                            );
                        }
                    },
                    "LightlordAthenaMinerva_SynchroSummon"
                );
            }
        },

        // ③の効果：起動効果
        onIgnition: {
            condition: (state, card) => {
                return withTurnAtOneceCondition(
                    state,
                    card,
                    (state) => {
                        const lightlordInGraveyard = new CardSelector(state)
                            .graveyard()
                            .filter()
                            .monster()
                            .include("ライトロード")
                            .get();
                        return lightlordInGraveyard.length > 0 && card.location === "MonsterField";
                    },
                    "LightlordAthenaMinerva_Ignition"
                );
            },
            effect: (state, card) => {
                withTurnAtOneceEffect(
                    state,
                    card,
                    (state, card) => {
                        const lightlordInGraveyard = (state: GameStore) =>
                            new CardSelector(state).graveyard().filter().monster().include("ライトロード").get();

                        const availableMonsters = lightlordInGraveyard(state);

                        if (availableMonsters.length > 0) {
                            const maxExclude = Math.min(4, Math.min(availableMonsters.length, state.deck.length));

                            withUserSelectCard(
                                state,
                                card,
                                lightlordInGraveyard,
                                {
                                    select: "multi",
                                    message: `墓地から「ライトロード」モンスターを最大4体まで選択して除外`,
                                    condition: (cards) => cards.length <= maxExclude,
                                },
                                (state, card, selected) => {
                                    const selectedCount = selected.length;
                                    if (selected.length > 0) {
                                        // 選択したモンスターを除外
                                        withExclusionMonsters(
                                            state,
                                            card,
                                            { cardIdList: selected.map((e) => e.id) },
                                            (state, card) => {
                                                withSendToGraveyardFromDeckTop(state, card, selectedCount, () => {}, {
                                                    byEffect: true,
                                                });
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    },
                    "LightlordAthenaMinerva_Ignition"
                );
            },
        },
        // TODO
        // ②の効果は常在効果のため、実装は省略（継続的効果システムが必要）
    },
    filterAvailableMaterials: (card) => {
        return monsterFilter(card.card);
    },
    materialCondition: (cards) => {
        const hasTuner = cards.some((c) => monsterFilter(c.card) && c.card.hasTuner);
        const hasNonTuner = cards.some((c) => monsterFilter(c.card) && !c.card.hasTuner);
        return hasTuner && hasNonTuner && sumLevel(cards) === 8;
    },
} satisfies SynchroMonsterCard;
