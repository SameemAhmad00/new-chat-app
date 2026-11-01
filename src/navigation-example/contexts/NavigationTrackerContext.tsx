import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

interface NavigationTrackerContextType {
    canGoBack: () => boolean;
    triggerExitConfirm: () => void;
    isExitModalOpen: boolean;
    closeExitModal: () => void;
    confirmExit: () => void;
}

const NavigationTrackerContext = createContext<NavigationTrackerContextType | undefined>(undefined);

export const NavigationTrackerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const lastBackPressRef = useRef<number>(0);

    const isRoot = location.pathname === '/' || location.pathname === '/chats';

    const canGoBack = () => {
        return !isRoot;
    };

    const triggerExitConfirm = () => {
        const currentTime = new Date().getTime();
        if (currentTime - lastBackPressRef.current < 2000) {
            CapacitorApp.exitApp();
        } else {
            lastBackPressRef.current = currentTime;
            setIsExitModalOpen(true);
        }
    };

    const closeExitModal = () => {
        setIsExitModalOpen(false);
    };

    const confirmExit = () => {
        setIsExitModalOpen(false);
        CapacitorApp.exitApp();
    };

    useEffect(() => {
        const backListener = CapacitorApp.addListener('backButton', () => {
            if (canGoBack()) {
                navigate(-1);
            } else {
                triggerExitConfirm();
            }
        });

        return () => {
            backListener.then(l => l.remove());
        };
    }, [location.pathname]);

    return (
        <NavigationTrackerContext.Provider
            value={{
                canGoBack,
                triggerExitConfirm,
                isExitModalOpen,
                closeExitModal,
                confirmExit,
            }}
        >
            {children}
        </NavigationTrackerContext.Provider>
    );
};

export const useNavigationTracker = (): NavigationTrackerContextType => {
    const context = useContext(NavigationTrackerContext);
    if (!context) {
        throw new Error('useNavigationTracker must be used within a NavigationTrackerProvider');
    }
    return context;
};
