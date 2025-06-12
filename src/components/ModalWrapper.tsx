import { type ReactNode, useEffect, useState } from "react";

interface ModalWrapperProps {
    children: ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    isTransparent?: boolean;
}

const ModalWrapper = ({ children, isOpen = true, onClose, isTransparent = false }: ModalWrapperProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Delay to ensure the component is rendered before starting animation
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        } else {
            setIsVisible(false);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 200); // Match the duration of CSS transition
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ease-out ${
                isTransparent ? "bg-transparent" : isVisible ? "bg-black bg-opacity-50" : "bg-black bg-opacity-0"
            }`}
            onClick={handleBackdropClick}
        >
            <div
                className={`bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-lg border-slate-900 border-2 transition-all duration-300 ease-out ${
                    isTransparent 
                        ? "opacity-20 scale-100 translate-y-0" 
                        : isVisible 
                        ? "opacity-100 scale-100 translate-y-0" 
                        : "opacity-0 scale-95 translate-y-4"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default ModalWrapper;
