import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/30",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/20 text-destructive border border-destructive/30",
        outline: "border border-border text-foreground",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
        warning: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30",
        live: "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
