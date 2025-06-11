import { useAtomValue } from "jotai";
import { fieldCenterAtom } from "@/store/fieldCenterAtom";

/**
 * フィールド中心座標系を使用したカード位置計算ユーティリティ
 */

/**
 * フィールド中心座標を取得するフック
 */
export const useFieldCenter = () => {
    return useAtomValue(fieldCenterAtom);
};

/**
 * フィールド中心からの相対座標でカード位置を定義
 */
export const FIELD_RELATIVE_POSITIONS = {
    // モンスターゾーン（上段、中央からの相対位置）
    monsterZone: (index: number): { x: number; y: number } => {
        const cardWidth = CARD_DIMENSIONS.mediumWidth;
        const spacing = 8;
        const totalWidth = 5 * cardWidth + 4 * spacing;
        const startX = -totalWidth / 2;
        return {
            x: startX + index * (cardWidth + spacing) + cardWidth / 2,
            y: -60, // フィールド中心より上
        };
    },

    // 魔法・罠ゾーン（下段、中央からの相対位置）
    spellZone: (index: number): { x: number; y: number } => {
        const cardWidth = CARD_DIMENSIONS.mediumWidth;
        const spacing = 8;
        const totalWidth = 5 * cardWidth + 4 * spacing;
        const startX = -totalWidth / 2;
        return {
            x: startX + index * (cardWidth + spacing) + cardWidth / 2,
            y: 120, // フィールド中心より下
        };
    },

    // エクストラモンスターゾーン
    extraMonsterZone: (index: number): { x: number; y: number } => {
        const cardWidth = CARD_DIMENSIONS.mediumWidth;
        const offsetX = index === 0 ? -cardWidth - 10 : cardWidth + 10;
        return {
            x: offsetX,
            y: -140, // モンスターゾーンより更に上
        };
    },

    // フィールド魔法ゾーン
    fieldZone: (): { x: number; y: number } => ({
        x: -300, // フィールド左側
        y: 0,
    }),

    // 手札エリア（フィールド中心から見た相対位置）
    handArea: (): { x: number; y: number } => ({
        x: 0,
        y: 280, // フィールドより大きく下
    }),

    // デッキ位置
    deck: (): { x: number; y: number } => ({
        x: 350, // フィールド右側
        y: 120,
    }),

    // 墓地位置
    graveyard: (): { x: number; y: number } => ({
        x: 350, // フィールド右側
        y: -60,
    }),

    // エクストラデッキ位置
    extraDeck: (): { x: number; y: number } => ({
        x: -350, // フィールド左側
        y: 120,
    }),

    // 除外ゾーン位置
    banished: (): { x: number; y: number } => ({
        x: -350, // フィールド左側
        y: -60,
    }),
};
