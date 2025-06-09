import type { MagicCard } from "@/types/card";
import { hasLevelMonsterFilter, monsterFilter } from "@/utils/cardManagement";
import { withOption, withTurnAtOneceCondition, withTurnAtOneceEffect, withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { banishFromRandomExtractDeck, sendCard } from "@/utils/cardMovement";

export const MAGIC_CARDS = [
    {
        card_name: "金満で謙虚な壺",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分はカードの効果でドローできない。①：自分のＥＸデッキのカード３枚または６枚を裏側表示で除外して発動できる。除外した数だけ自分のデッキの上からカードをめくり、その中から１枚を選んで手札に加え、残りのカードを好きな順番でデッキの一番下に戻す。ターン終了時まで相手が受ける全てのダメージは半分になる。",
        image: "card100214871_1.jpg",
        effect: {
            onSpell: {
                condition: (state, card) =>
                    withTurnAtOneceCondition(state, card, () => state.extraDeck.length >= 3 && state.deck.length >= 3),
                effect: (state, card) =>
                    withTurnAtOneceEffect(state, card, () => {
                        withOption(
                            state,
                            card,
                            [
                                {
                                    name: "３枚除外",
                                    condition: (state) => state.extraDeck.length >= 3 && state.deck.length >= 3,
                                },
                                {
                                    name: "６枚除外",
                                    condition: (state) => state.extraDeck.length >= 6 && state.deck.length >= 6,
                                },
                            ],
                            (state, card, option) => {
                                const excludeNum = option === "３枚除外" ? 3 : 6;
                                banishFromRandomExtractDeck(state, excludeNum);
                                withUserSelectCard(
                                    state,
                                    card,
                                    state.deck.slice(0, excludeNum),
                                    { select: "single" as const },
                                    (state, _cardInstance, selected) => {
                                        sendCard(state, selected[0], "Hand" as const);
                                    }
                                );
                            }
                        );
                    }),
            },
        },
    },
    {
        card_name: "ワン・フォー・ワン",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：手札からモンスター１体を墓地へ送って発動できる。手札・デッキからレベル１モンスター１体を特殊召喚する。",
        image: "card100013349_1.jpg",
        effect: {
            onSpell: {
                condition: (state) => {
                    if (state.hand.filter((e) => monsterFilter(e.card)).length === 0) {
                        return false;
                    }
                    if (
                        [...state.deck, ...state.hand].filter(
                            (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                        ).length === 0
                    ) {
                        return false;
                    }
                    // 手札にレベル1モンスター一体かつ手札コストとして払えるのがそれだけかつデッキに１コスがない場合NG
                    if (
                        state.deck.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 0 &&
                        state.hand.filter((e) => monsterFilter(e.card)).length === 1 &&
                        state.hand.filter((e) => hasLevelMonsterFilter(e.card) && e.card.level === 1).length === 1
                    ) {
                        return false;
                    }
                    return true;
                },
                effect: (state, card) =>
                    withUserSelectCard(
                        state,
                        card,
                        state.hand.filter((e) => monsterFilter(e.card)),
                        {
                            select: "single",
                            condition: (cardList, state) => {
                                const targetList = [...state.hand, ...state.deck].filter(
                                    (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                                );
                                if (targetList.length >= 2) {
                                    return true;
                                }
                                if (targetList.length === 1) {
                                    return targetList[0].id !== cardList[0].id;
                                } else {
                                    return false;
                                }
                            },
                        },
                        (state, card, select) => {
                            sendCard(state, select[0], "Graveyard");
                            withUserSelectCard(
                                state,
                                card,
                                [...state.hand, ...state.deck].filter(
                                    (e) => hasLevelMonsterFilter(e.card) && e.card.level === 1
                                ),
                                {
                                    select: "single",
                                },
                                (state, card, selected) => {
                                    withUserSummon(state, card, selected[0], () => {});
                                }
                            );
                        }
                    ),
            },
        },
    },
    {
        card_name: "おろかな埋葬",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：デッキからモンスター１体を墓地へ送る。",
        image: "card100024670_1.jpg",
        effect: {},
    },
    {
        card_name: "ジャック・イン・ザ・ハンド",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは1ターンに1枚しか発動できない。①：デッキからカード名が異なるレベル1モンスター3体を相手に見せ、相手はその中から1体を選んで自身の手札に加える。自分は残りのカードの中から1体を選んで手札に加え、残りをデッキに戻す。",
        image: "card100204881_1.jpg",
        effect: {},
    },
    {
        card_name: "エマージェンシー・サイバー",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できない。①：デッキから「サイバー・ドラゴン」モンスターまたは通常召喚できない機械族・光属性モンスター１体を手札に加える。②：相手によってこのカードの発動が無効になり、このカードが墓地へ送られた場合、手札を１枚捨てて発動できる。このカードを手札に加える。",
        image: "card100095117_1.jpg",
        effect: {},
    },
    {
        card_name: "極超の竜輝巧",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できず、このカードを発動するターン、自分は通常召喚できないモンスターしか特殊召喚できない。①：デッキから「ドライトロン」モンスター１体を特殊召喚する。この効果で特殊召喚したモンスターはエンドフェイズに破壊される。",
        image: "card100206552_1.jpg",
        effect: {},
    },
    {
        card_name: "竜輝巧－ファフニール",
        card_type: "魔法" as const,
        magic_type: "フィールド魔法" as const,
        text: "このカード名のカードは１ターンに１枚しか発動できない。①：このカードの発動時の効果処理として、デッキから「竜輝巧－ファフニール」以外の「ドライトロン」魔法・罠カード１枚を手札に加える事ができる。②：儀式魔法カードの効果の発動及びその発動した効果は無効化されない。③：１ターンに１度、自分フィールドに「ドライトロン」モンスターが存在する状態で、モンスターが表側表示で召喚・特殊召喚された場合に発動できる。このターン、その表側表示モンスターのレベルは、その攻撃力１０００につき１つ下がる（最小１まで）。",
        image: "card100206543_1.jpg",
        effect: {},
    },
    {
        card_name: "テラ・フォーミング",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "①：デッキからフィールド魔法カード１枚を手札に加える。",
        image: "card73707637_1.jpg",
        effect: {},
    },
    {
        card_name: "チキンレース",
        card_type: "魔法" as const,
        magic_type: "フィールド魔法" as const,
        text: "①：このカードがフィールドゾーンに存在する限り、相手よりＬＰが少ないプレイヤーが受ける全てのダメージは０になる。②：お互いのプレイヤーは１ターンに１度、自分メインフェイズに１０００ＬＰを払って以下の効果から１つを選択して発動できる。この効果の発動に対して、お互いは魔法・罠・モンスターの効果を発動できない。●デッキから１枚ドローする。●このカードを破壊する。●相手は１０００ＬＰ回復する。",
        image: "card100022942_1.jpg",
        effect: {},
    },
    {
        card_name: "盆回し",
        card_type: "魔法" as const,
        magic_type: "速攻魔法" as const,
        text: "①：自分のデッキからカード名が異なるフィールド魔法カード2枚を選び、その内の1枚を自分フィールドにセットし、もう1枚を相手フィールドにセットする。この効果でセットしたカードのいずれかがフィールドゾーンにセットされている限り、お互いに他のフィールド魔法カードを発動・セットできない。",
        image: "card100046458_1.jpg",
        effect: {},
    },
    {
        card_name: "流星輝巧群",
        card_type: "魔法" as const,
        magic_type: "儀式魔法" as const,
        text: "儀式モンスターの降臨に必要。このカード名の②の効果は１ターンに１度しか使用できない。①：攻撃力の合計が儀式召喚するモンスターの攻撃力以上になるように、自分の手札・フィールドの機械族モンスターをリリースし、自分の手札・墓地から儀式モンスター１体を儀式召喚する。②：このカードが墓地に存在する場合、自分フィールドの「ドライトロン」モンスター１体を対象として発動できる。そのモンスターの攻撃力を相手ターン終了時まで１０００ダウンし、このカードを手札に加える。",
        image: "card100206549_1.jpg",
        effect: {},
    },
    {
        card_name: "高等儀式術",
        card_type: "魔法" as const,
        magic_type: "儀式魔法" as const,
        text: "儀式モンスターの降臨に必要。①：レベルの合計が儀式召喚するモンスターと同じになるように、デッキから通常モンスターを墓地へ送り、手札から儀式モンスター１体を儀式召喚する。",
        image: "card1001286_1.jpg",
        effect: {},
    },
    {
        card_name: "儀式の準備",
        card_type: "魔法" as const,
        magic_type: "通常魔法" as const,
        text: "デッキからレベル７以下の儀式モンスター１体を手札に加える。その後、自分の墓地から儀式魔法カード１枚を選んで手札に加える事ができる。",
        image: "card100123678_1.jpg",
        effect: {},
    },
] as const satisfies readonly MagicCard[];