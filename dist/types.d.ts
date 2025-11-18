export type WalkthroughTooltipPosition = "top" | "right" | "bottom" | "left";
export interface WalkthroughStep {
    stepCategory: string;
    pageUrl: string;
    stepName: string;
    stepDescription: string;
    highlightElement: string;
    tooltipPosition: WalkthroughTooltipPosition;
}
