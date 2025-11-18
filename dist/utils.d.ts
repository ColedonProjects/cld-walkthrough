import type { WalkthroughTooltipPosition } from "./types";
export declare const DEFAULT_DISMISSAL_KEY = "cld-walkthrough-dismissed";
export declare const saveDismissalState: (storageKey?: string) => void;
export declare const clearDismissalState: (storageKey?: string) => void;
export declare const isWalkthroughDismissed: (storageKey?: string) => boolean;
export declare const findElementByDataHighlight: (highlightValue: string) => HTMLElement | null;
export interface TooltipCoordinates {
    top: number;
    left: number;
    position: WalkthroughTooltipPosition;
}
export declare const calculateTooltipPosition: (element: HTMLElement, preferredPosition: WalkthroughTooltipPosition, tooltipWidth?: number, tooltipHeight?: number) => TooltipCoordinates;
