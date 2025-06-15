import React, { useEffect, useState } from "react";

interface NotificationBannerProps {
    message: string;
    duration: number;
    isVisible: boolean;
    onComplete: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
    message,
    duration,
    isVisible,
    onComplete,
}) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onComplete, 300); // アニメーション完了後にコールバック実行
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg transition-all duration-300 ${
                show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
        >
            <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">{message}</div>
            </div>
        </div>
    );
};