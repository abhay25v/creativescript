import axios from "axios";
import { API_URL } from "./constants";

export const apiClient = axios.create({
	baseURL: API_URL,
	timeout: 20000,
});

export function withAuth(token?: string) {
	return token ? { Authorization: `Bearer ${token}` } : undefined;
}
