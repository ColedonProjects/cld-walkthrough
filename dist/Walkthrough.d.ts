import "./styles/walkthrough.css";
import type { WalkthroughStep } from "./types";
export interface WalkthroughProps {
    steps: WalkthroughStep[];
    autoStart?: boolean;
    initialStep?: number;
    dismissedStorageKey?: string;
    startEventName?: string;
    onDismiss?: () => void;
    onStepChange?: (index: number, step: WalkthroughStep) => void;
}
export declare const emitWalkthroughStart: (step?: number, eventName?: string) => void;
export declare function Walkthrough({ steps, autoStart, initialStep, dismissedStorageKey, startEventName, onDismiss, onStepChange, }: WalkthroughProps): import("react/jsx-runtime").JSX.Element | null;
