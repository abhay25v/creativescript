"use client";

import * as React from "react";
import { cn } from "@/app/lib/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, label, ...props }, ref) => {
		return (
			<div className={cn("w-full", label && "space-y-2")}>
				{label ? (
					<label className='block text-sm font-semibold text-slate-700'>
						{label}
					</label>
				) : null}
				<input
					ref={ref}
					type={type}
					className={cn(
						"flex h-11 w-full rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]",
						className
					)}
					{...props}
				/>
			</div>
		);
	}
);
Input.displayName = "Input";
