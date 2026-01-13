"use client";

import { STORAGE_KEYS } from "./constants";

export type ChatAuth = {
	user: {
		id: string | number;
		fullName?: string;
		email?: string;
		role?: string;
		image?: string;
		specialty?: string;
		workLocation?: string;
		phone?: string;
	};
	token: string;
};

export function getStoredAuth(): ChatAuth | null {
	if (typeof window === "undefined") return null;
	const raw = localStorage.getItem(STORAGE_KEYS.auth);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as ChatAuth;
	} catch {
		return null;
	}
}

export function setStoredAuth(auth: ChatAuth) {
	localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(auth));
}

export function clearStoredAuth() {
	localStorage.removeItem(STORAGE_KEYS.auth);
}
