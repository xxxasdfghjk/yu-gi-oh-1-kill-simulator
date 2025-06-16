import type { LeveledMonsterCard } from "@/types/card";
import { withOption, withUserSelectCard, withDraw, withExclusionMonsters } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";
import { CardSelector } from "@/utils/CardSelector";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "サイバー・ヴァリー",
    card_type: "モンスター" as const,
    text: "次の効果から１つを選択して発動する事ができる。●このカードが相手モンスターの攻撃対象になった時、このカードをゲームから除外する事で自分はデッキからカードを１枚ドローし、そのバトルフェイズを終了させる。●このカードと自分フィールド上に表側表示で存在するモンスター１体を選択し、ゲームから除外する。自分のデッキからカードを２枚ドローする。●このカードと自分の手札１枚を選択してゲームから除外する。自分の墓地のカード１枚をデッキの一番上に置く。",
    image: "card100004149_1.jpg",
    monster_type: "効果モンスター",
    level: 1,
    element: "光" as const,
    race: "機械" as const,
    attack: 0,
    defense: 0,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                // フィールドに存在している必要がある
                if (card.location !== "MonsterField") return false;

                // オプション1: フィールドに他のモンスターが存在するか
                const otherMonsters = new CardSelector(state).allMonster().filter().nonNull().excludeId(card.id).get();
                const option1Available = otherMonsters.length > 0 && state.deck.length >= 2;

                // オプション2: 手札が存在し、墓地にカードがあるか
                const option2Available = state.hand.length > 0 && state.graveyard.length > 0;
                return option1Available || option2Available;
            },
            effect: (state, card) => {
                // 効果の選択肢を作成
                const options = [];

                // オプション1: モンスター除外で2枚ドロー
                const otherMonsters = new CardSelector(state).allMonster().filter().nonNull().excludeId(card.id).get();
                if (otherMonsters.length > 0 && state.deck.length >= 2) {
                    options.push({
                        name: "モンスター除外で2枚ドロー",
                        condition: () => true,
                    });
                }

                // オプション2: 手札除外で墓地カードをデッキトップへ
                if (state.hand.length > 0 && state.graveyard.length > 0) {
                    options.push({
                        name: "手札除外で墓地カードをデッキトップへ",
                        condition: () => true,
                    });
                }

                withOption(
                    state,
                    card,
                    options,
                    (state, card, selectedOption) => {
                        if (selectedOption === "モンスター除外で2枚ドロー") {
                            // このカードと他のモンスターを除外
                            const id = card.id;
                            const availableMonsters = (state: GameStore) =>
                                new CardSelector(state).allMonster().filter().nonNull().excludeId(id).get();

                            withUserSelectCard(
                                state,
                                card,
                                availableMonsters,
                                {
                                    select: "single",
                                    message: "除外するモンスターを選択してください",
                                    canCancel: true,
                                },
                                (state, card, selected) => {
                                    withExclusionMonsters(
                                        state,
                                        card,
                                        { cardIdList: [card.id, selected[0].id] },
                                        (state, card) => {
                                            withDraw(state, card, { count: 2 });
                                        }
                                    );
                                }
                            );
                        } else if (selectedOption === "手札除外で墓地カードをデッキトップへ") {
                            // 手札を選択して除外
                            withUserSelectCard(
                                state,
                                card,
                                (state) => new CardSelector(state).hand().getNonNull(),
                                {
                                    select: "single",
                                    message: "除外する手札を選択してください",
                                    canCancel: true,
                                },
                                (state, card, selectedHand) => {
                                    if (selectedHand.length > 0) {
                                        withExclusionMonsters(
                                            state,
                                            card,
                                            { cardIdList: [card.id, selectedHand[0].id] },
                                            (state, card) => {
                                                withUserSelectCard(
                                                    state,
                                                    card,
                                                    (state) => new CardSelector(state).graveyard().getNonNull(),
                                                    {
                                                        select: "single",
                                                        message: "デッキトップに置く墓地のカードを選択してください",
                                                        canCancel: false,
                                                    },
                                                    (state, _, selectedGraveyard) => {
                                                        if (selectedGraveyard.length > 0) {
                                                            // 墓地からデッキトップへ移動
                                                            const targetCard = selectedGraveyard[0];
                                                            sendCard(state, targetCard, "Deck", { deckTop: true });
                                                        }
                                                    }
                                                );
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    },
                    true
                );
            },
        },
    },
} satisfies LeveledMonsterCard;
