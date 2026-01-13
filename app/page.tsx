"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		const auth = localStorage.getItem("chat_auth");
		if (!auth) {
			router.replace("/auth?mode=login");
		} else {
			router.replace("/dashboard");
		}
	}, [router]);

	return (
		<div className='h-screen flex items-center justify-center'>
			<div className='animate-pulse flex flex-col items-center'>
				<div className='w-12 h-12 bg-indigo-600 rounded-full mb-4'></div>
				<p className='text-gray-500 font-medium tracking-widest text-xs uppercase'>
					Loading ChatConnect
				</p>
			</div>
		</div>
	);
}
