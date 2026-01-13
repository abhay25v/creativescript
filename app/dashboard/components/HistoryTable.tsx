"use client";

import { useMemo, useState } from "react";

export type HistoryRow = {
	id: number | string;
	name: string;
	type: string;
	duration: string;
	date: string;
};

type Props = {
	rows: HistoryRow[];
	height?: number;
	rowHeight?: number;
};

export function HistoryTable({ rows, height = 560, rowHeight = 56 }: Props) {
	const [scrollTop, setScrollTop] = useState(0);

	const totalHeight = rows.length * rowHeight;
	const overscan = 10;

	const { startIndex, endIndex } = useMemo(() => {
		const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
		const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
		const end = Math.min(rows.length, start + visibleCount);
		return { startIndex: start, endIndex: end };
	}, [scrollTop, rowHeight, height, rows.length]);

	const visibleRows = rows.slice(startIndex, endIndex);
	const offsetY = startIndex * rowHeight;

	return (
		<div className='bg-white rounded-3xl border border-(--color-border) overflow-hidden'>
			<div className='bg-slate-50 border-b border-(--color-border) grid grid-cols-4 gap-0'>
				<div className='p-4 text-left text-[12px] font-extrabold uppercase tracking-widest text-slate-400'>
					Session
				</div>
				<div className='p-4 text-left text-[12px] font-extrabold uppercase tracking-widest text-slate-400'>
					Type
				</div>
				<div className='p-4 text-left text-[12px] font-extrabold uppercase tracking-widest text-slate-400'>
					Duration
				</div>
				<div className='p-4 text-left text-[12px] font-extrabold uppercase tracking-widest text-slate-400'>
					Date
				</div>
			</div>

			<div
				style={{ height }}
				className='relative overflow-auto'
				onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
			>
				<div style={{ height: totalHeight, position: "relative" }}>
					<div
						style={{ transform: `translateY(${offsetY}px)` }}
						className='absolute inset-x-0 top-0'
					>
						{visibleRows.map((h) => (
							<div
								key={h.id}
								style={{ height: rowHeight }}
								className='grid grid-cols-4 items-center border-b border-slate-100'
							>
								<div className='px-4 font-extrabold text-slate-900 truncate'>
									{h.name}
								</div>
								<div className='px-4 italic text-slate-500 truncate'>{h.type}</div>
								<div className='px-4 text-sm text-slate-700'>{h.duration}</div>
								<div className='px-4 text-sm text-slate-400'>{h.date}</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
