import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./styles/walkthrough.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_DISMISSAL_KEY, calculateTooltipPosition, clearDismissalState, findElementByDataHighlight, isWalkthroughDismissed, saveDismissalState, } from "./utils";
const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 150;
const MAX_HIGHLIGHT_ATTEMPTS = 60;
const HIGHLIGHT_RETRY_DELAY = 150;
const DEFAULT_EVENT_NAME = "cld-walkthrough:start";
const getCenteredTooltipPosition = () => {
    if (typeof window === "undefined") {
        return { top: 0, left: 0, position: "bottom", arrowOffset: 0 };
    }
    return {
        top: window.innerHeight / 3,
        left: window.innerWidth / 2 - 160,
        position: "bottom",
        arrowOffset: 0,
    };
};
export const emitWalkthroughStart = (step = 0, eventName = DEFAULT_EVENT_NAME) => {
    if (typeof window === "undefined")
        return;
    window.dispatchEvent(new CustomEvent(eventName, {
        detail: { step },
    }));
};
export function Walkthrough({ steps, autoStart = false, initialStep = 0, dismissedStorageKey = DEFAULT_DISMISSAL_KEY, startEventName = DEFAULT_EVENT_NAME, onDismiss, onStepChange, }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isActive, setIsActive] = useState(autoStart && !isWalkthroughDismissed(dismissedStorageKey));
    const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
    const [spotlightPath, setSpotlightPath] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState(getCenteredTooltipPosition());
    const overlayRef = useRef(null);
    const tooltipRef = useRef(null);
    const highlightCloneRef = useRef(null);
    const elevatedElementRef = useRef(null);
    const navigationLockedRef = useRef(false);
    const pendingStartRef = useRef(autoStart ? initialStep : null);
    const removeHighlightClone = useCallback(() => {
        var _a;
        if (highlightCloneRef.current &&
            ((_a = overlayRef.current) === null || _a === void 0 ? void 0 : _a.contains(highlightCloneRef.current))) {
            overlayRef.current.removeChild(highlightCloneRef.current);
        }
        highlightCloneRef.current = null;
        if (elevatedElementRef.current) {
            elevatedElementRef.current.classList.remove("walkthrough-elevated-original");
            elevatedElementRef.current = null;
        }
    }, []);
    const cloneHighlightedElement = useCallback((element, rect) => {
        if (!overlayRef.current)
            return;
        removeHighlightClone();
        const wrapper = document.createElement("div");
        wrapper.className = "walkthrough-highlight-wrapper";
        wrapper.style.top = `${rect.top}px`;
        wrapper.style.left = `${rect.left}px`;
        wrapper.style.width = `${rect.width}px`;
        wrapper.style.height = `${rect.height}px`;
        const computedStyles = window.getComputedStyle(element);
        wrapper.style.borderRadius = computedStyles.borderRadius || "8px";
        const backgroundColor = computedStyles.backgroundColor &&
            computedStyles.backgroundColor !== "rgba(0, 0, 0, 0)"
            ? computedStyles.backgroundColor
            : getComputedStyle(document.body).backgroundColor || "#ffffff";
        wrapper.style.backgroundColor = backgroundColor;
        const clone = element.cloneNode(true);
        clone.classList.add("walkthrough-highlight-clone");
        wrapper.appendChild(clone);
        const border = document.createElement("div");
        border.className = "walkthrough-highlight-border";
        wrapper.appendChild(border);
        overlayRef.current.appendChild(wrapper);
        highlightCloneRef.current = wrapper;
        element.classList.add("walkthrough-elevated-original");
        elevatedElementRef.current = element;
    }, [removeHighlightClone]);
    const startWalkthroughAt = useCallback((targetIndex) => {
        if (!steps.length)
            return;
        const bounded = Math.max(0, Math.min(targetIndex, steps.length - 1));
        const targetStep = steps[bounded];
        if (!targetStep)
            return;
        clearDismissalState(dismissedStorageKey);
        setIsActive(true);
        navigationLockedRef.current = false;
        setSpotlightPath(null);
        removeHighlightClone();
        setTooltipPosition(getCenteredTooltipPosition());
        setCurrentStepIndex(bounded);
        onStepChange === null || onStepChange === void 0 ? void 0 : onStepChange(bounded, targetStep);
        const url = targetStep.pageUrl.startsWith("/")
            ? targetStep.pageUrl
            : `/${targetStep.pageUrl}`;
        router.push(url);
        setTimeout(() => {
            navigationLockedRef.current = true;
        }, 100);
    }, [
        dismissedStorageKey,
        onStepChange,
        removeHighlightClone,
        router,
        steps,
    ]);
    useEffect(() => {
        if (!autoStart)
            return;
        if (!steps.length)
            return;
        if (isWalkthroughDismissed(dismissedStorageKey))
            return;
        pendingStartRef.current = initialStep;
        setIsActive(true);
    }, [autoStart, dismissedStorageKey, initialStep, steps]);
    useEffect(() => {
        if (pendingStartRef.current === null)
            return;
        if (!isActive)
            return;
        startWalkthroughAt(pendingStartRef.current);
        pendingStartRef.current = null;
    }, [isActive, startWalkthroughAt]);
    useEffect(() => {
        const handleStart = (event) => {
            var _a;
            const detail = event.detail;
            const stepIndex = (_a = detail === null || detail === void 0 ? void 0 : detail.step) !== null && _a !== void 0 ? _a : 0;
            clearDismissalState(dismissedStorageKey);
            pendingStartRef.current = stepIndex;
            setIsActive(true);
        };
        window.addEventListener(startEventName, handleStart);
        return () => {
            window.removeEventListener(startEventName, handleStart);
        };
    }, [dismissedStorageKey, startEventName]);
    useEffect(() => {
        if (!isActive)
            return;
        navigationLockedRef.current = true;
        const handleBeforeUnload = (event) => {
            if (navigationLockedRef.current) {
                event.preventDefault();
                event.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.body.classList.add("walkthrough-active");
        return () => {
            navigationLockedRef.current = false;
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.body.classList.remove("walkthrough-active");
        };
    }, [isActive]);
    useEffect(() => {
        if (!isActive)
            return;
        if (!steps.length)
            return;
        const currentUrl = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;
        const matchIndex = steps.findIndex((step) => step.pageUrl.split("?")[0] === currentUrl.split("?")[0]);
        if (matchIndex !== -1) {
            setCurrentStepIndex(matchIndex);
            onStepChange === null || onStepChange === void 0 ? void 0 : onStepChange(matchIndex, steps[matchIndex]);
        }
    }, [isActive, steps, pathname, searchParams, onStepChange]);
    useEffect(() => {
        if (!isActive)
            return;
        if (!steps.length)
            return;
        if (currentStepIndex < 0)
            return;
        const currentStep = steps[currentStepIndex];
        if (!currentStep)
            return;
        let retryTimeout;
        const attempt = (count = 0) => {
            var _a, _b, _c, _d;
            const element = findElementByDataHighlight(currentStep.highlightElement);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                const rect = element.getBoundingClientRect();
                cloneHighlightedElement(element, rect);
                const tooltipPos = calculateTooltipPosition(element, currentStep.tooltipPosition, TOOLTIP_WIDTH, TOOLTIP_HEIGHT);
                const tooltipWidth = (_b = (_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.offsetWidth) !== null && _b !== void 0 ? _b : TOOLTIP_WIDTH;
                const tooltipHeight = (_d = (_c = tooltipRef.current) === null || _c === void 0 ? void 0 : _c.offsetHeight) !== null && _d !== void 0 ? _d : TOOLTIP_HEIGHT;
                const highlightCenterX = rect.left + rect.width / 2;
                const highlightCenterY = rect.top + rect.height / 2;
                const arrowOffset = tooltipPos.position === "top" || tooltipPos.position === "bottom"
                    ? highlightCenterX - (tooltipPos.left + tooltipWidth / 2)
                    : highlightCenterY - (tooltipPos.top + tooltipHeight / 2);
                setSpotlightPath(`path("M0 0H${window.innerWidth}V${window.innerHeight}H0Z M${rect.left - 12} ${rect.top - 12}H${rect.right + 12}V${rect.bottom + 12}H${rect.left - 12}Z")`);
                setTooltipPosition({ ...tooltipPos, arrowOffset });
            }
            else if (count < MAX_HIGHLIGHT_ATTEMPTS) {
                retryTimeout = window.setTimeout(() => attempt(count + 1), HIGHLIGHT_RETRY_DELAY);
            }
            else {
                removeHighlightClone();
                setSpotlightPath(null);
                setTooltipPosition(getCenteredTooltipPosition());
            }
        };
        attempt();
        return () => {
            if (retryTimeout)
                window.clearTimeout(retryTimeout);
            removeHighlightClone();
        };
    }, [
        cloneHighlightedElement,
        currentStepIndex,
        isActive,
        removeHighlightClone,
        steps,
    ]);
    const handleDismiss = () => {
        saveDismissalState(dismissedStorageKey);
        removeHighlightClone();
        setSpotlightPath(null);
        setTooltipPosition(getCenteredTooltipPosition());
        setIsActive(false);
        onDismiss === null || onDismiss === void 0 ? void 0 : onDismiss();
    };
    const handleNext = () => {
        if (currentStepIndex >= steps.length - 1) {
            handleDismiss();
            return;
        }
        startWalkthroughAt(currentStepIndex + 1);
    };
    const handlePrevious = () => {
        if (currentStepIndex <= 0)
            return;
        startWalkthroughAt(currentStepIndex - 1);
    };
    if (!isActive || !steps.length) {
        return null;
    }
    const overlayStyle = spotlightPath
        ? { "--spotlight-path": spotlightPath }
        : undefined;
    const tooltipStyle = tooltipPosition
        ? {
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
        }
        : undefined;
    if (tooltipStyle && typeof tooltipPosition.arrowOffset === "number") {
        tooltipStyle["--arrow-offset"] = `${tooltipPosition.arrowOffset}px`;
    }
    const currentStep = steps[currentStepIndex];
    const overlayClass = spotlightPath
        ? "walkthrough-overlay has-spotlight"
        : "walkthrough-overlay";
    return (_jsx("div", { className: overlayClass, ref: overlayRef, style: overlayStyle, children: tooltipPosition && tooltipStyle && (_jsxs("div", { ref: tooltipRef, className: "walkthrough-tooltip", "data-position": tooltipPosition.position, style: tooltipStyle, children: [_jsxs("div", { className: "walkthrough-tooltip-header", children: [_jsxs("div", { children: [_jsx("div", { className: "walkthrough-tooltip-category", children: currentStep.stepCategory }), _jsx("h3", { className: "walkthrough-tooltip-title", children: currentStep.stepName })] }), _jsxs("span", { className: "walkthrough-tooltip-step-count", children: ["Step ", currentStepIndex + 1, " of ", steps.length] })] }), _jsx("p", { className: "walkthrough-tooltip-description", children: currentStep.stepDescription }), _jsxs("div", { className: "walkthrough-tooltip-actions", children: [_jsx("button", { className: "walkthrough-button walkthrough-button-secondary", onClick: handleDismiss, children: "Dismiss" }), _jsxs("div", { className: "walkthrough-tooltip-actions-right", children: [currentStepIndex > 0 && (_jsx("button", { className: "walkthrough-button walkthrough-button-ghost", onClick: handlePrevious, children: "Previous" })), _jsx("button", { className: "walkthrough-button walkthrough-button-primary", onClick: handleNext, children: currentStepIndex < steps.length - 1 ? "Next" : "Complete" })] })] })] })) }));
}
