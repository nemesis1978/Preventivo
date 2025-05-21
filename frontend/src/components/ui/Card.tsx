import * as React from "react";

import { cn } from "@/lib/utils";

// Define the base props that our Card component will always have
interface CardBaseProps {} // Can be empty if no unique props beyond HTML ones

// Define the props for the Card component, making it polymorphic
// E is a generic type that extends React.ElementType (e.g., 'div', 'a', 'button')
type CardProps<E extends React.ElementType> = CardBaseProps &
  Omit<React.ComponentPropsWithRef<E>, keyof CardBaseProps> & {
    as?: E; // The 'as' prop allows specifying the rendered HTML element
  };

// Default element type if 'as' prop is not provided
const defaultCardElement = "div" as const;

// Define the Card component using React.forwardRef
// The first generic is the type of the element being rendered (e.g., HTMLDivElement)
// The second generic is the type of the props the component accepts
const Card = React.forwardRef(
  <E extends React.ElementType = typeof defaultCardElement>(
    { as, className, ...props }: CardProps<E>,
    ref: React.ComponentPropsWithRef<E>["ref"]
  ) => {
    const Component = as || defaultCardElement;

    return (
      <Component
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props} // Spread the rest of the props
      />
    );
  }
) as (<E extends React.ElementType = typeof defaultCardElement>(
  props: CardProps<E> & { ref?: React.ComponentPropsWithRef<E>["ref"] }
) => React.ReactElement | null) & { displayName?: string }; // Type assertion for forwardRef with generics

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'div';
}

const CardTitle = React.forwardRef<
  HTMLHeadingElement, // Changed from HTMLParagraphElement to be more generic for headings
  CardTitleProps
>(({ className, as: Component = "h3", ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };