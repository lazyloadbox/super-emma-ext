import React, { createContext, useContext, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Collapsible({ children, defaultOpen = false, open, onOpenChange }: CollapsibleProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;

  const toggle = () => {
    const newState = !isOpen;
    if (isControlled) {
      onOpenChange?.(newState);
    } else {
      setInternalIsOpen(newState);
      onOpenChange?.(newState);
    }
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className="collapsible">
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function CollapsibleTrigger({ children, className, asChild = false }: CollapsibleTriggerProps) {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within a Collapsible');
  }

  const { isOpen, toggle } = context;

  if (asChild) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: toggle,
      className: cn(className, child.props.className),
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center justify-between w-full text-left",
        className
      )}
    >
      {children}
      {isOpen ? (
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
      )}
    </button>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within a Collapsible');
  }

  const { isOpen } = context;

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-200 ease-in-out",
        isOpen ? "animate-in slide-in-from-top-1" : "animate-out slide-out-to-top-1 hidden",
        className
      )}
    >
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
} 