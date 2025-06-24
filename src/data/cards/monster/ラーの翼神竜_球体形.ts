import { CardSelector } from "@/utils/CardSelector";
import { withUserSelectCard, withUserSummon } from "@/utils/effectUtils";
import { releaseCard } from "@/utils/cardMovement";
import type { LeveledMonsterCard } from "@/types/card";
import type { GameStore } from "@/store/gameStore";

export default {
    card_name: "ラーの翼神竜-球体形",
    card_type: "モンスター" as const,
    text: "このカードは特殊召喚できない。このカードを通常召喚する場合、自分フィールドのモンスター３体をリリースして自分フィールドに召喚、または相手フィールドのモンスター３体をリリースして相手フィールドに召喚しなければならず、召喚したこのカードのコントロールは次のターンのエンドフェイズに元々の持ち主に戻る。 ①：このカードは攻撃できず、相手の攻撃・効果の対象にならない。 ②：このカードをリリースして発動できる。 手札・デッキから「ラーの翼神竜」１体を、召喚条件を無視し、攻撃力・守備力を４０００にして特殊召喚する。",
    image: "card100024574_1.jpg",
    monster_type: "効果モンスター",
    element: "神" as const,
    race: "幻神獣" as const,
    level: 10,
    attack: 0,
    defense: 0,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: true as const,
    summonLimited: true as const,
    effect: {
        onIgnition: {
            condition: (state, card) => {
                const raInHandOrDeck = new CardSelector(state).hand().deck().filter().include("ラーの翼神竜").get();
                return raInHandOrDeck.length > 0 && card.location === "MonsterField";
            },
            effect: (state, card) => {
                const raInHandOrDeck = (state: GameStore) =>
                    new CardSelector(state).hand().deck().filter().include("ラーの翼神竜").get();
                if (raInHandOrDeck(state).length > 0) {
                    // 球体形をリリース
                    releaseCard(state, card);

                    withUserSelectCard(
                        state,
                        card,
                        raInHandOrDeck,
                        {
                            select: "single",
                            message: "特殊召喚する「ラーの翼神竜」を選択してください",
                        },
                        (state, card, selected) => {
                            if (selected.length > 0) {
                                const raCard = selected[0];
                                // 攻撃力・守備力を4000に設定
                                const buffedRa = {
                                    ...raCard,
                                    buf: { attack: 4000, defense: 4000, level: 0 },
                                };

                                withUserSummon(
                                    state,
                                    card,
                                    buffedRa,
                                    {
                                        canSelectPosition: false,
                                        optionPosition: ["attack"],
                                    },
                                    () => {}
                                );
                            }
                        }
                    );
                }
            },
        },
    },
} satisfies LeveledMonsterCard;
