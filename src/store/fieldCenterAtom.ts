import { atom } from "jotai";

export interface FieldCenterCoordinates {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * フィールドエリア（エクストラモンスターゾーン + プレイヤーフィールド）の中心座標
 */
export const fieldCenterAtom = atom<FieldCenterCoordinates>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
});

/**
 * フィールドエリアの中心座標を計算する関数
 */
export const calculateFieldCenter = (
    extraMonsterZonesElement: HTMLElement | null,
    playerFieldElement: HTMLElement | null
): FieldCenterCoordinates => {
    const defaultCoords: FieldCenterCoordinates = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 800,
        height: 600,
    };

    if (!extraMonsterZonesElement || !playerFieldElement) {
        return defaultCoords;
    }

    const extraRect = extraMonsterZonesElement.getBoundingClientRect();
    const playerRect = playerFieldElement.getBoundingClientRect();

    // 2つの領域を含む全体の境界を計算
    const left = Math.min(extraRect.left, playerRect.left);
    const right = Math.max(extraRect.right, playerRect.right);
    const top = Math.min(extraRect.top, playerRect.top);
    const bottom = Math.max(extraRect.bottom, playerRect.bottom);

    const width = right - left;
    const height = bottom - top;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    return {
        x: centerX,
        y: centerY,
        width,
        height,
    };
};

/**
 * フィールド中心からの相対座標を計算する
 */
export const getRelativePosition = (absoluteX: number, absoluteY: number, fieldCenter: FieldCenterCoordinates) => {
    return {
        x: absoluteX - fieldCenter.x,
        y: absoluteY - fieldCenter.y,
    };
};

/**
 * 相対座標から絶対座標を計算する
 */
export const getAbsolutePosition = (relativeX: number, relativeY: number, fieldCenter: FieldCenterCoordinates) => {
    return {
        x: fieldCenter.x + relativeX,
        y: fieldCenter.y + relativeY,
    };
};
