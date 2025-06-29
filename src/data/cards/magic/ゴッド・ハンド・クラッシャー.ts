import type { MagicCard } from "@/types/card";

export default {
    card_name: "ゴッド・ハンド・クラッシャー",
    card_type: "魔法" as const,
    text: "このカード名のカードは１ターンに１枚しか発動できない。このカードの発動と効果は無効化されない。①：自分フィールドに元々のカード名が「オベリスクの巨神兵」となるモンスターが存在する場合に発動できる。相手フィールドの効果モンスター１体を選び、効果を無効にし破壊する。このターン、この効果で破壊したモンスター及びそのモンスターと元々のカード名が同じモンスターの効果は無効化される。このカードを自分メインフェイズに発動した場合、さらに以下の効果を適用できる。●相手フィールドの魔法・罠カードを全て破壊する。",
    image: "card100220247_1.jpg",
    magic_type: "通常魔法" as const,
    effect: {
        onSpell: {
            condition: () => false, // このカードは常に発動不可
            payCost: () => false, // このカードは常にコスト支払い不可
            effect: () => {},
        },
    },
} satisfies MagicCard;
