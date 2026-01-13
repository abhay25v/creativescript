"use client";

import * as React from "react";
import { cn } from "@/app/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className, variant = "primary", size = "md", type = "button", ...props },
		ref
	) => {
		return (
			<button
				ref={ref}
				type={type}
				className={cn(
					"inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) disabled:pointer-events-none disabled:opacity-50",
					size === "sm" && "h-9 px-3 text-sm",
					size === "md" && "h-11 px-4 text-sm",
					size === "lg" && "h-12 px-5 text-base",
					variant === "primary" &&
						"bg-(--color-primary) text-white hover:bg-(--color-primary-dark)",
					variant === "secondary" &&
						"bg-white text-slate-900 border border-(--color-border) hover:bg-slate-50",
					variant === "ghost" && "bg-transparent hover:bg-slate-100 text-slate-900",
					variant === "danger" &&
						"bg-white text-(--color-error) border border-(--color-border) hover:bg-red-50",
					className
				)}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";
