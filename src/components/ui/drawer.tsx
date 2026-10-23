"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

type DrawerContextProps = {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
};

const DrawerContext = React.createContext<DrawerContextProps | null>(null);

function useDrawer() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error("useDrawer must be used within a Drawer.");
  }

  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "right",
  children,
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;
  const contextValue = React.useMemo(
    () => ({ hasSnapPoints, modal, showSwipeHandle, swipeDirection }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection]
  );

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      >
        {children}
      </DrawerPrimitive.Root>
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-[99998] min-h-dvh bg-dark/60 backdrop-blur-xs transition-opacity duration-300 ease-out select-none",
        "data-starting-style:opacity-0 data-ending-style:opacity-0",
        className
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 flex shrink-0 cursor-grab items-center justify-center transition-opacity duration-200",
        "group-data-[swipe-axis=x]/drawer-popup:h-full group-data-[swipe-axis=x]/drawer-popup:w-3.5",
        "group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=y]/drawer-popup:h-3.5",
        "after:block after:shrink-0 after:rounded-full after:bg-gray-4",
        "group-data-[swipe-axis=x]/drawer-popup:after:h-20 group-data-[swipe-axis=x]/drawer-popup:after:w-1",
        "group-data-[swipe-axis=y]/drawer-popup:after:h-1 group-data-[swipe-axis=y]/drawer-popup:after:w-16 active:cursor-grabbing",
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: DrawerPrimitive.Popup.Props) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis =
    swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-[99999] select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-swipe-direction={swipeDirection}
          data-snap-points={hasSnapPoints ? "" : undefined}
          className={cn(
            "group/drawer-popup pointer-events-auto fixed z-[99999] flex flex-col bg-white text-dark shadow-2xl transition-[transform,opacity] duration-300 ease-out will-change-transform outline-none select-none",
            // Side Drawer (swipeDirection = right)
            "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-full data-[swipe-direction=right]:max-w-[480px]",
            "data-[swipe-direction=right]:border-l data-[swipe-direction=right]:border-gray-3",
            "data-[swipe-direction=right]:[--closed-transform:translate3d(100%,0,0)]",
            // Side Drawer (swipeDirection = left)
            "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-full data-[swipe-direction=left]:max-w-[480px]",
            "data-[swipe-direction=left]:border-r data-[swipe-direction=left]:border-gray-3",
            "data-[swipe-direction=left]:[--closed-transform:translate3d(-100%,0,0)]",
            // Bottom Drawer (swipeDirection = down)
            "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:max-h-[calc(100dvh-4rem)] data-[swipe-direction=down]:rounded-t-2xl",
            "data-[swipe-direction=down]:border-t data-[swipe-direction=down]:border-gray-3",
            "data-[swipe-direction=down]:[--closed-transform:translate3d(0,100%,0)]",
            // Top Drawer (swipeDirection = up)
            "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:max-h-[calc(100dvh-4rem)] data-[swipe-direction=up]:rounded-b-2xl",
            "data-[swipe-direction=up]:border-b data-[swipe-direction=up]:border-gray-3",
            "data-[swipe-direction=up]:[--closed-transform:translate3d(0,-100%,0)]",
            // State transitions
            "data-starting-style:transform-[var(--closed-transform)] data-starting-style:opacity-0",
            "data-ending-style:transform-[var(--closed-transform)] data-ending-style:opacity-0",
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] select-text"
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex shrink-0 flex-col gap-1 p-6 pb-4 border-b border-gray-3", className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex shrink-0 flex-col gap-3 p-6 pt-4 border-t border-gray-3 bg-white", className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-xl font-semibold text-dark", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-dark-4", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
