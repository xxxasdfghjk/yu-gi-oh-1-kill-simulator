import { fieldCenterAtom } from "@/store/fieldCenterAtom";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

export const useCalcFieldCenter = () => {
    // エリアの中心座標を計算・更新
    const setFieldCenter = useSetAtom(fieldCenterAtom);

    const fieldContainerRef = useRef<HTMLDivElement>(null);

    const updateFieldCenter = useCallback(() => {
        if (fieldContainerRef.current) {
            const rect = fieldContainerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            setFieldCenter({
                x: centerX,
                y: centerY,
                width: rect.width,
                height: rect.height,
            });
        }
    }, [setFieldCenter]);

    // 初期座標計算とリサイズ監視
    useEffect(() => {
        // 初期計算
        updateFieldCenter();

        // ウィンドウリサイズ時に再計算
        const handleResize = () => {
            updateFieldCenter();
        };

        window.addEventListener("resize", handleResize);

        // ResizeObserverでフィールド要素のサイズ変更を監視
        const resizeObserver = new ResizeObserver(() => {
            updateFieldCenter();
        });

        if (fieldContainerRef.current) {
            resizeObserver.observe(fieldContainerRef.current);
        }

        return () => {
            window.removeEventListener("resize", handleResize);
            resizeObserver.disconnect();
        };
    }, [updateFieldCenter]);
    return { fieldContainerRef };
};
