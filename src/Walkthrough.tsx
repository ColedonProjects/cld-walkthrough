"use client";
import "./styles/walkthrough.css";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { WalkthroughStep } from "./types";
import
{
  DEFAULT_DISMISSAL_KEY,
  calculateTooltipPosition,
  clearDismissalState,
  findElementByDataHighlight,
  isWalkthroughDismissed,
  saveDismissalState,
} from "./utils";

export interface WalkthroughProps
{
  steps: WalkthroughStep[];
  autoStart?: boolean;
  initialStep?: number;
  dismissedStorageKey?: string;
  startEventName?: string;
  onDismiss?: () => void;
  onStepChange?: ( index: number, step: WalkthroughStep ) => void;
}

type WalkthroughTooltipPosition = WalkthroughStep[ "tooltipPosition" ];
type TooltipState = {
  top: number;
  left: number;
  position: WalkthroughTooltipPosition;
  arrowOffset?: number;
};

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 150;
const MAX_HIGHLIGHT_ATTEMPTS = 60;
const HIGHLIGHT_RETRY_DELAY = 150;
const DEFAULT_EVENT_NAME = "cld-walkthrough:start";

const getCenteredTooltipPosition = (): TooltipState =>
{
  if ( typeof window === "undefined" )
  {
    return { top: 0, left: 0, position: "bottom", arrowOffset: 0 };
  }

  return {
    top: window.innerHeight / 3,
    left: window.innerWidth / 2 - 160,
    position: "bottom",
    arrowOffset: 0,
  };
};

export const emitWalkthroughStart = (
  step = 0,
  eventName: string = DEFAULT_EVENT_NAME
) =>
{
  if ( typeof window === "undefined" ) return;
  window.dispatchEvent(
    new CustomEvent( eventName, {
      detail: { step },
    } )
  );
};

export function Walkthrough ( {
  steps,
  autoStart = false,
  initialStep = 0,
  dismissedStorageKey = DEFAULT_DISMISSAL_KEY,
  startEventName = DEFAULT_EVENT_NAME,
  onDismiss,
  onStepChange,
}: WalkthroughProps )
{
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [ isActive, setIsActive ] = useState(
    autoStart && !isWalkthroughDismissed( dismissedStorageKey )
  );
  const [ currentStepIndex, setCurrentStepIndex ] = useState( initialStep );
  const [ spotlightPath, setSpotlightPath ] = useState<string | null>( null );
  const [ tooltipPosition, setTooltipPosition ] = useState<TooltipState>(
    getCenteredTooltipPosition()
  );

  const overlayRef = useRef<HTMLDivElement>( null );
  const tooltipRef = useRef<HTMLDivElement>( null );
  const highlightCloneRef = useRef<HTMLDivElement | null>( null );
  const elevatedElementRef = useRef<HTMLElement | null>( null );
  const navigationLockedRef = useRef( false );
  const pendingStartRef = useRef<number | null>(
    autoStart ? initialStep : null
  );

  const removeHighlightClone = useCallback( () =>
  {
    if (
      highlightCloneRef.current &&
      overlayRef.current?.contains( highlightCloneRef.current )
    )
    {
      overlayRef.current.removeChild( highlightCloneRef.current );
    }
    highlightCloneRef.current = null;
    if ( elevatedElementRef.current )
    {
      elevatedElementRef.current.classList.remove(
        "walkthrough-elevated-original"
      );
      elevatedElementRef.current = null;
    }
  }, [] );

  const cloneHighlightedElement = useCallback(
    ( element: HTMLElement, rect: DOMRect ) =>
    {
      if ( !overlayRef.current ) return;

      removeHighlightClone();

      const wrapper = document.createElement( "div" );
      wrapper.className = "walkthrough-highlight-wrapper";
      wrapper.style.top = `${ rect.top }px`;
      wrapper.style.left = `${ rect.left }px`;
      wrapper.style.width = `${ rect.width }px`;
      wrapper.style.height = `${ rect.height }px`;

      const computedStyles = window.getComputedStyle( element );
      wrapper.style.borderRadius = computedStyles.borderRadius || "8px";

      const backgroundColor =
        computedStyles.backgroundColor &&
          computedStyles.backgroundColor !== "rgba(0, 0, 0, 0)"
          ? computedStyles.backgroundColor
          : getComputedStyle( document.body ).backgroundColor || "#ffffff";
      wrapper.style.backgroundColor = backgroundColor;

      const clone = element.cloneNode( true ) as HTMLElement;
      clone.classList.add( "walkthrough-highlight-clone" );
      wrapper.appendChild( clone );

      const border = document.createElement( "div" );
      border.className = "walkthrough-highlight-border";
      wrapper.appendChild( border );

      overlayRef.current.appendChild( wrapper );
      highlightCloneRef.current = wrapper;
      element.classList.add( "walkthrough-elevated-original" );
      elevatedElementRef.current = element;
    },
    [ removeHighlightClone ]
  );

  const startWalkthroughAt = useCallback(
    ( targetIndex: number ) =>
    {
      if ( !steps.length ) return;
      const bounded = Math.max( 0, Math.min( targetIndex, steps.length - 1 ) );
      const targetStep = steps[ bounded ];
      if ( !targetStep ) return;

      clearDismissalState( dismissedStorageKey );
      setIsActive( true );
      navigationLockedRef.current = false;
      setSpotlightPath( null );
      removeHighlightClone();
      setTooltipPosition( getCenteredTooltipPosition() );
      setCurrentStepIndex( bounded );
      onStepChange?.( bounded, targetStep );

      const url = targetStep.pageUrl.startsWith( "/" )
        ? targetStep.pageUrl
        : `/${ targetStep.pageUrl }`;
      router.push( url );

      setTimeout( () =>
      {
        navigationLockedRef.current = true;
      }, 100 );
    },
    [
      dismissedStorageKey,
      onStepChange,
      removeHighlightClone,
      router,
      steps,
    ]
  );

  useEffect( () =>
  {
    if ( !autoStart ) return;
    if ( !steps.length ) return;
    if ( isWalkthroughDismissed( dismissedStorageKey ) ) return;

    pendingStartRef.current = initialStep;
    setIsActive( true );
  }, [ autoStart, dismissedStorageKey, initialStep, steps ] );

  useEffect( () =>
  {
    if ( pendingStartRef.current === null ) return;
    if ( !isActive ) return;
    startWalkthroughAt( pendingStartRef.current );
    pendingStartRef.current = null;
  }, [ isActive, startWalkthroughAt ] );

  useEffect( () =>
  {
    const handleStart = ( event: Event ) =>
    {
      const detail = ( event as CustomEvent<{ step?: number; }> ).detail;
      const stepIndex = detail?.step ?? 0;
      clearDismissalState( dismissedStorageKey );
      pendingStartRef.current = stepIndex;
      setIsActive( true );
    };

    window.addEventListener( startEventName, handleStart as EventListener );
    return () =>
    {
      window.removeEventListener( startEventName, handleStart as EventListener );
    };
  }, [ dismissedStorageKey, startEventName ] );

  useEffect( () =>
  {
    if ( !isActive ) return;

    navigationLockedRef.current = true;

    const handleBeforeUnload = ( event: BeforeUnloadEvent ) =>
    {
      if ( navigationLockedRef.current )
      {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener( "beforeunload", handleBeforeUnload );
    document.body.classList.add( "walkthrough-active" );

    return () =>
    {
      navigationLockedRef.current = false;
      window.removeEventListener( "beforeunload", handleBeforeUnload );
      document.body.classList.remove( "walkthrough-active" );
    };
  }, [ isActive ] );

  useEffect( () =>
  {
    if ( !isActive ) return;
    if ( !steps.length ) return;

    const currentUrl = searchParams.toString()
      ? `${ pathname }?${ searchParams.toString() }`
      : pathname;

    const matchIndex = steps.findIndex(
      ( step ) => step.pageUrl.split( "?" )[ 0 ] === currentUrl.split( "?" )[ 0 ]
    );

    if ( matchIndex !== -1 )
    {
      setCurrentStepIndex( matchIndex );
      onStepChange?.( matchIndex, steps[ matchIndex ] );
    }
  }, [ isActive, steps, pathname, searchParams, onStepChange ] );

  useEffect( () =>
  {
    if ( !isActive ) return;
    if ( !steps.length ) return;
    if ( currentStepIndex < 0 ) return;

    const currentStep = steps[ currentStepIndex ];
    if ( !currentStep ) return;

    let retryTimeout: number | undefined;

    const attempt = ( count = 0 ) =>
    {
      const element = findElementByDataHighlight( currentStep.highlightElement );
      if ( element )
      {
        element.scrollIntoView( { behavior: "smooth", block: "center" } );
        const rect = element.getBoundingClientRect();
        cloneHighlightedElement( element, rect );
        const tooltipPos = calculateTooltipPosition(
          element,
          currentStep.tooltipPosition,
          TOOLTIP_WIDTH,
          TOOLTIP_HEIGHT
        );
        const tooltipWidth = tooltipRef.current?.offsetWidth ?? TOOLTIP_WIDTH;
        const tooltipHeight = tooltipRef.current?.offsetHeight ?? TOOLTIP_HEIGHT;
        const highlightCenterX = rect.left + rect.width / 2;
        const highlightCenterY = rect.top + rect.height / 2;

        const arrowOffset =
          tooltipPos.position === "top" || tooltipPos.position === "bottom"
            ? highlightCenterX - ( tooltipPos.left + tooltipWidth / 2 )
            : highlightCenterY - ( tooltipPos.top + tooltipHeight / 2 );

        setSpotlightPath(
          `path("M0 0H${ window.innerWidth }V${ window.innerHeight }H0Z M${ rect.left - 12
          } ${ rect.top - 12 }H${ rect.right + 12 }V${ rect.bottom + 12 }H${ rect.left - 12
          }Z")`
        );
        setTooltipPosition( { ...tooltipPos, arrowOffset } );
      } else if ( count < MAX_HIGHLIGHT_ATTEMPTS )
      {
        retryTimeout = window.setTimeout(
          () => attempt( count + 1 ),
          HIGHLIGHT_RETRY_DELAY
        );
      } else
      {
        removeHighlightClone();
        setSpotlightPath( null );
        setTooltipPosition( getCenteredTooltipPosition() );
      }
    };

    attempt();

    return () =>
    {
      if ( retryTimeout ) window.clearTimeout( retryTimeout );
      removeHighlightClone();
    };
  }, [
    cloneHighlightedElement,
    currentStepIndex,
    isActive,
    removeHighlightClone,
    steps,
  ] );

  const handleDismiss = () =>
  {
    saveDismissalState( dismissedStorageKey );
    removeHighlightClone();
    setSpotlightPath( null );
    setTooltipPosition( getCenteredTooltipPosition() );
    setIsActive( false );
    onDismiss?.();
  };

  const handleNext = () =>
  {
    if ( currentStepIndex >= steps.length - 1 )
    {
      handleDismiss();
      return;
    }
    startWalkthroughAt( currentStepIndex + 1 );
  };

  const handlePrevious = () =>
  {
    if ( currentStepIndex <= 0 ) return;
    startWalkthroughAt( currentStepIndex - 1 );
  };

  if ( !isActive || !steps.length )
  {
    return null;
  }

  const overlayStyle: CSSProperties | undefined = spotlightPath
    ? ( { "--spotlight-path": spotlightPath } as CSSProperties )
    : undefined;

  const tooltipStyle: ( CSSProperties & Record<string, string | number> ) | undefined =
    tooltipPosition
      ? {
        top: `${ tooltipPosition.top }px`,
        left: `${ tooltipPosition.left }px`,
      }
      : undefined;

  if ( tooltipStyle && typeof tooltipPosition.arrowOffset === "number" )
  {
    tooltipStyle[ "--arrow-offset" ] = `${ tooltipPosition.arrowOffset }px`;
  }

  const currentStep = steps[ currentStepIndex ];
  const overlayClass = spotlightPath
    ? "walkthrough-overlay has-spotlight"
    : "walkthrough-overlay";

  return (
    <div className={ overlayClass } ref={ overlayRef } style={ overlayStyle }>
      { tooltipPosition && tooltipStyle && (
        <div
          ref={ tooltipRef }
          className="walkthrough-tooltip"
          data-position={ tooltipPosition.position }
          style={ tooltipStyle }
        >
          <div className="walkthrough-tooltip-header">
            <div>
              <div className="walkthrough-tooltip-category">
                { currentStep.stepCategory }
              </div>
              <h3 className="walkthrough-tooltip-title">
                { currentStep.stepName }
              </h3>
            </div>

            <span className="walkthrough-tooltip-step-count">
              Step { currentStepIndex + 1 } of { steps.length }
            </span>
          </div>

          <p className="walkthrough-tooltip-description">
            { currentStep.stepDescription }
          </p>

          <div className="walkthrough-tooltip-actions">
            <button
              className="walkthrough-button walkthrough-button-secondary"
              onClick={ handleDismiss }
            >
              Dismiss
            </button>

            <div className="walkthrough-tooltip-actions-right">
              { currentStepIndex > 0 && (
                <button
                  className="walkthrough-button walkthrough-button-ghost"
                  onClick={ handlePrevious }
                >
                  Previous
                </button>
              ) }

              <button
                className="walkthrough-button walkthrough-button-primary"
                onClick={ handleNext }
              >
                { currentStepIndex < steps.length - 1 ? "Next" : "Complete" }
              </button>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
}

