export const DEFAULT_DISMISSAL_KEY = "cld-walkthrough-dismissed";
export const saveDismissalState = (storageKey = DEFAULT_DISMISSAL_KEY) => {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(storageKey, "true");
};
export const clearDismissalState = (storageKey = DEFAULT_DISMISSAL_KEY) => {
    if (typeof window === "undefined")
        return;
    localStorage.removeItem(storageKey);
};
export const isWalkthroughDismissed = (storageKey = DEFAULT_DISMISSAL_KEY) => {
    if (typeof window === "undefined")
        return false;
    return localStorage.getItem(storageKey) === "true";
};
export const findElementByDataHighlight = (highlightValue) => {
    if (typeof document === "undefined")
        return null;
    return document.querySelector(`[data-highlight="${highlightValue}"]`);
};
export const calculateTooltipPosition = (element, preferredPosition, tooltipWidth = 320, tooltipHeight = 150) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const spacing = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top = 0;
    let left = 0;
    let position = preferredPosition;
    switch (preferredPosition) {
        case "top":
            top = rect.top + scrollTop - tooltipHeight - spacing;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            if (top < scrollTop) {
                top = rect.bottom + scrollTop + spacing;
                position = "bottom";
            }
            break;
        case "bottom":
            top = rect.bottom + scrollTop + spacing;
            left = rect.left + scrollLeft + rect.width / 2 - tooltipWidth / 2;
            if (top + tooltipHeight > scrollTop + viewportHeight) {
                top = rect.top + scrollTop - tooltipHeight - spacing;
                position = "top";
            }
            break;
        case "right":
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + scrollLeft + spacing;
            if (left + tooltipWidth > scrollLeft + viewportWidth) {
                left = rect.left + scrollLeft - tooltipWidth - spacing;
                position = "left";
            }
            break;
        case "left":
            top = rect.top + scrollTop + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollLeft - tooltipWidth - spacing;
            if (left < scrollLeft) {
                left = rect.right + scrollLeft + spacing;
                position = "right";
            }
            break;
    }
    if (left < scrollLeft)
        left = scrollLeft + 16;
    if (left + tooltipWidth > scrollLeft + viewportWidth) {
        left = scrollLeft + viewportWidth - tooltipWidth - 16;
    }
    if (top < scrollTop)
        top = scrollTop + 16;
    if (top + tooltipHeight > scrollTop + viewportHeight) {
        top = scrollTop + viewportHeight - tooltipHeight - 16;
    }
    return { top, left, position };
};
