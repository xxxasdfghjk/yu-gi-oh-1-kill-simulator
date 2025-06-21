import { withUserSummon, withUserSelectCard, withDelayRecursive } from "@/utils/effectUtils";
import { sendCard } from "@/utils/cardMovement";

export default {
    card_name: "ライトロード・アーチャー フェリス",
    card_type: "モンスター" as const,
    text: "このカードは通常召喚できず、カードの効果でのみ特殊召喚出来る。この カードが効果モンスターの効果によってデッキから墓地に送られた時に 発動する。この カードを墓地から特殊召喚する。また、このカードをリリース して発動出来る。相手フィールド上のモンスター1体を選択して破壊する。 その後、自分のデッキの上からカードを3枚墓地に送る。",
    image: "card100180215_1.jpg",
    monster_type: "効果モンスター",
    level: 4,
    element: "光" as const,
    race: "獣戦士族" as const,
    attack: 1100,
    defense: 2000,
    hasDefense: true as const,
    hasLevel: true as const,
    hasRank: false as const,
    hasLink: false as const,
    canNormalSummon: false as const,
    effect: {
        onDeckToGraveyard: (state, card) => {
            // 効果モンスターの効果によってデッキから墓地に送られた時、特殊召喚する
            withUserSummon(
                state,
                card,
                card,
                {
                    canSelectPosition: true,
                    optionPosition: ["attack", "defense"]
                },
                () => {}
            );
        },
        onIgnition: {
            condition: (state, card) => {
                const opponentMonsters = [
                    ...state.opponentField.monsterZones.filter(m => m !== null),
                    ...state.opponentField.extraMonsterZones.filter(m => m !== null)
                ];
                return opponentMonsters.length > 0 && card.location === "MonsterField";
            },
            effect: (state, card) => {
                const opponentMonsters = [
                    ...state.opponentField.monsterZones.filter(m => m !== null),
                    ...state.opponentField.extraMonsterZones.filter(m => m !== null)
                ];
                
                // このカードをリリース
                sendCard(state, card, "Graveyard");
                
                withUserSelectCard(
                    state,
                    card,
                    () => opponentMonsters,
                    {
                        select: "single",
                        message: "破壊する相手モンスターを選択してください"
                    },
                    (state, card, selected) => {
                        if (selected.length > 0) {
                            sendCard(state, selected[0], "Graveyard");
                            
                            // デッキの上から3枚墓地に送る
                            withDelayRecursive(
                                state,
                                card,
                                { delay: 100 },
                                3,
                                (state, card, depth) => {
                                    if (state.deck.length > 0) {
                                        sendCard(state, state.deck[0], "Graveyard");
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    },
};
