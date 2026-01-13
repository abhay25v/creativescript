"use client";

import { useCallback, useMemo, useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement,
	ArcElement,
	RadialLinearScale,
} from "chart.js";
import { Bar, Line, Doughnut, Radar } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
	PointElement,
	LineElement,
	ArcElement,
	RadialLinearScale
);
import {
	Send,
	Paperclip,
	Smile,
	CheckCheck,
	User,
	Star,
	RefreshCcw,
	Lock,
	Camera,
	Activity,
	Info,
	Download,
	Filter,
	Clock,
	X,
	Check,
	AlertCircle,
	TrendingUp,
	MessageCircle,
	Phone,
	Video,
	Settings,
	MoreHorizontal,
	ArrowLeft,
	LogOut,
} from "lucide-react";
import {
	FaHistory,
	FaCog,
} from "react-icons/fa";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { apiClient, withAuth } from "@/app/lib/apiClient";
import { SOCKET_URL } from "@/app/lib/constants";
import { clearStoredAuth, getStoredAuth, type ChatAuth } from "@/app/lib/chatAuth";
import { useDebouncedValue } from "@/app/lib/useDebouncedValue";
import { HistoryTable, type HistoryRow } from "@/app/dashboard/components/HistoryTable";

const get_initials = (name: string) =>
	(name || "")
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
const format_Time = (ts?: string) => {
	if (!ts) return "--:--";
	const d = new Date(ts);
	if (isNaN(d.getTime())) return "--:--";
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const format_Date = (ts: string) => new Date(ts).toLocaleDateString();

type ConnectionUser = {
	id: string | number;
	fullName: string;
	image?: string;
	status?: "online" | "offline" | string;
	lastMessage?: string;
	role?: string;
};

type ChatMessage = {
	message?: string;
	content?: string;
	senderId?: string | number;
	from?: string | number;
	receiverId?: string | number;
	mediaType?: "text";
	timestamp?: string;
};

type RelationConnection = {
	student?: ConnectionUser | null;
	preceptor?: ConnectionUser | null;
};

function safeId(id: unknown) {
	return typeof id === "string" ? id : String(id ?? "");
}

function getNowIso() {
	return new Date().toISOString();
}

function DashboardContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const activeTab = searchParams.get("tab") || "chat";

	const [users, setUsers] = useState<ConnectionUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [SelectedUser, setSelectedUser] = useState<ConnectionUser | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [search_query, setSearchQuery] = useState("");
	const debouncedSearch = useDebouncedValue(search_query, 300);
	const [auth, setAuth] = useState<ChatAuth | null>(null);
	const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [profile_Edit_Mode, setProfileEditMode] = useState(false);
	const [temp_Profile_Data, setTempProfileData] = useState<Partial<ChatAuth["user"]>>({});
	const [SOCKET_CONNECTED, SET_SOCKET_STATUS] = useState(false);
	const [draft_Messages, setDraftMessages] = useState<Record<string, string>>({});
	const socketRef = useRef<Socket | null>(null);

	const filteredUsers = useMemo(() => {
		const q = search_query.trim().toLowerCase();
		if (!q) return users;
		return users.filter((u) => (u.fullName || "").toLowerCase().includes(q));
	}, [users, search_query]);

	const fetchUsers = useCallback(
		async (name?: string) => {
			if (!auth?.token) return;
			setLoading(true);
			try {
				const res = await apiClient.get("/relation", {
					params: {
						type: "accepted",
						page: 1,
						limit: 50,
						...(name ? { name } : null),
					},
					headers: withAuth(auth.token),
				});
				const raw = (res.data.connections || []) as RelationConnection[];
				const me = safeId(auth.user?.id);
				const mapped = raw
					.map((c) => (safeId(c.student?.id) === me ? c.preceptor : c.student))
					.filter((u): u is ConnectionUser => Boolean(u));
				setUsers(mapped);
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		},
		[auth?.token, auth?.user?.id]
	);

	const bar_chart_data = {
		labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
		datasets: [
			{
				label: "Messages Sent",
				data: [1200, 1900, 3000, 5000, 2000, 3000],
				backgroundColor: "rgba(99, 102, 241, 0.5)",
			},
		],
	};

	const line_chart_data = {
		labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
		datasets: [
			{
				label: "Active Users",
				data: [400, 600, 800, 1000],
				borderColor: "rgb(75, 192, 192)",
				tension: 0.1,
			},
		],
	};

	const doughnut_chart_data = {
		labels: ["Direct", "Group", "System"],
		datasets: [
			{
				label: "Message Type",
				data: [300, 50, 100],
				backgroundColor: [
					"rgb(255, 99, 132)",
					"rgb(54, 162, 235)",
					"rgb(255, 205, 86)",
				],
			},
		],
	};

	const radar_chart_data = {
		labels: ["Speed", "Quality", "Tone", "Resolution", "Empathy"],
		datasets: [
			{
				label: "Interaction Metrics",
				data: [85, 92, 78, 90, 88],
				backgroundColor: "rgba(99, 102, 241, 0.2)",
				borderColor: "rgb(99, 102, 241)",
				pointBackgroundColor: "rgb(99, 102, 241)",
			},
		],
	};

	useEffect(() => {
		const stored = getStoredAuth();
		if (stored?.token) setAuth(stored);
		else router.replace("/auth?mode=login");
	}, [router]);

	useEffect(() => {
		if (!auth?.token) return;
		void fetchUsers(debouncedSearch);
	}, [auth?.token, debouncedSearch, fetchUsers]);

	useEffect(() => {
		if (!auth?.token) return;
		if (socketRef.current) return;

		const socket = io(SOCKET_URL);
		socketRef.current = socket;

		socket.on("connect", () => {
			SET_SOCKET_STATUS(true);
			socket.emit("login", { userId: safeId(auth.user.id) });
		});

		socket.on("connect_error", (err: unknown) => {
			console.error("SOCKET CONNECTION ERROR:", err);
			SET_SOCKET_STATUS(false);
		});

		socket.on("disconnect", () => {
			SET_SOCKET_STATUS(false);
		});

		socket.on("message", (msg: unknown) => {
			const data = msg as Partial<ChatMessage>;
			const incoming: ChatMessage = {
				message: data?.message ?? data?.content ?? "",
				senderId: safeId(data?.senderId ?? data?.from ?? ""),
				timestamp: data?.timestamp ?? getNowIso(),
			};
			setMessages((prev) => [...prev, incoming]);
		});

		return () => {
			socket.off();
			socket.disconnect();
			socketRef.current = null;
		};
	}, [auth?.token, auth?.user?.id]);

	const loadMessages = async (userId: ConnectionUser["id"]) => {
		setLoading(true);
		try {
			const response = await apiClient.get(`/chats/${safeId(userId)}`, {
				params: { page: 1, pageSize: 200 },
				headers: withAuth(auth?.token),
			});
			setMessages((response.data.data || []) as ChatMessage[]);
		} finally {
			setLoading(false);
		}
	};

	const handleSendMessage = () => {
		if (!newMessage.trim() || !SelectedUser) return;

		const outgoing: ChatMessage = {
			message: newMessage,
			receiverId: safeId(SelectedUser.id),
			senderId: safeId(auth?.user?.id),
			mediaType: "text" as const,
		};

		socketRef.current?.emit("message", outgoing);

		setMessages((prev) => [...prev, { ...outgoing, timestamp: getNowIso() }]);
		setNewMessage("");
		setDraftMessages((d) => ({ ...d, [safeId(SelectedUser.id)]: "" }));
	};

	const navigateTo = (t: string) => router.push(`/dashboard?tab=${t}`);

	useEffect(() => {
		if (activeTab !== "history") return;
		setHistoryData((prev) =>
			prev.length
				? prev
				: Array.from({ length: 1500 }).map((_, i) => ({
						id: i,
						name: `Record #${i}`,
						type: i % 2 === 0 ? "Voice" : "Video",
						date: "2024-01-10",
						duration: "5:22",
					}))
		);
	}, [activeTab]);

	const loadNotifications = async () => {
		console.log("Loading notifications mock...");
	};

	const handleProfileUpdate = async () => {
		// Mock update logic (no API needed as per README)
		setLoading(true);
		setTimeout(() => {
			setProfileEditMode(false);
			setLoading(false);
			alert("Profile updated successfully (Simulation)");
		}, 1000);
	};

	const handleLogout = () => {
		clearStoredAuth();
		router.replace("/auth?mode=login");
	};

	if (!auth) return <div className='p-20 text-center'>Loading Session...</div>;

	return (
		<div className='flex h-screen bg-[#fafafa]'>
			{/* SIDEBAR */}
			<aside
				style={{
					width: sidebarCollapsed ? "80px" : "280px",
					backgroundColor: "#fff",
					borderRight: "1px solid #ddd",
				}}
			>
				<div className='p-6 flex items-center justify-between'>
					{!sidebarCollapsed && (
						<h1 className='font-bold text-[20px]'>ChatApp</h1>
					)}
					<button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
						<Settings size={18} />
					</button>
				</div>

				<nav className='p-4 space-y-2'>
					<button
						onClick={() => navigateTo("chat")}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							backgroundColor: activeTab === "chat" ? "#eef2ff" : "transparent",
							color: activeTab === "chat" ? "#4f46e5" : "#374151",
						}}
					>
						<MessageCircle size={20} /> {!sidebarCollapsed && "Chat"}
					</button>
					<button
						onClick={() => navigateTo("history")}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							backgroundColor:
								activeTab === "history" ? "#eef2ff" : "transparent",
							color: activeTab === "history" ? "#4f46e5" : "#374151",
						}}
					>
						<FaHistory size={18} /> {!sidebarCollapsed && "History"}
					</button>
					<button
						onClick={() => navigateTo("profile")}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							backgroundColor:
								activeTab === "profile" ? "#eef2ff" : "transparent",
							color: activeTab === "profile" ? "#4f46e5" : "#374151",
						}}
					>
						<User size={20} /> {!sidebarCollapsed && "Profile"}
					</button>
					<button
						onClick={() => navigateTo("settings")}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							backgroundColor:
								activeTab === "settings" ? "#eef2ff" : "transparent",
							color: activeTab === "settings" ? "#4f46e5" : "#374151",
						}}
					>
						<FaCog size={18} /> {!sidebarCollapsed && "Settings"}
					</button>
					<button
						onClick={() => navigateTo("analytics")}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							backgroundColor:
								activeTab === "analytics" ? "#eef2ff" : "transparent",
							color: activeTab === "analytics" ? "#4f46e5" : "#374151",
						}}
					>
						<TrendingUp size={20} /> {!sidebarCollapsed && "Analytics"}
					</button>
					<button
						onClick={handleLogout}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: "12px",
							display: "flex",
							alignItems: "center",
							gap: "12px",
							fontSize: "14px",
							fontWeight: "500",
							border: "none",
							cursor: "pointer",
							marginTop: "40px",
							backgroundColor: "transparent",
							color: "#ef4444",
						}}
					>
						<LogOut size={20} /> {!sidebarCollapsed && "Logout"}
					</button>
				</nav>

				{activeTab === "chat" && !sidebarCollapsed && (
					<div className='p-4 flex-1 overflow-hidden flex flex-col'>
						<Input
							placeholder='Search...'
							value={search_query}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setSearchQuery(e.target.value)
							}
							className='mb-4'
						/>
						<div className='flex-1 overflow-y-auto space-y-1'>
							{filteredUsers.map((u) => (
									<button
										key={u.id}
										onClick={() => {
											setSelectedUser(u);
											loadMessages(u.id);
										}}
										className={`w-full p-4 flex items-center gap-4 rounded-2xl transition-all ${
											SelectedUser?.id === u.id
												? "bg-white shadow-lg shadow-indigo-100 ring-1 ring-indigo-50"
												: "hover:bg-white/60"
										}`}
									>
										<div className='relative'>
											<img
												src={
													u.image ||
													`https://ui-avatars.com/api/?name=${u.fullName}&background=random`
												}
												className='w-11 h-11 rounded-full border-2 border-white object-cover'
											/>
											<div
												className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
													u.status === "online" ? "bg-green-500" : "bg-gray-300"
												}`}
											></div>
										</div>
										<div className='flex-1 text-left min-w-0'>
											<div className='flex justify-between items-center mb-0.5'>
												<span className='text-[14px] font-black truncate text-gray-900'>
													{u.fullName}
												</span>
												<span className='text-[9px] font-bold text-gray-400'>
													12:45 PM
												</span>
											</div>
											<span className='text-[10px] text-gray-500 font-medium truncate block'>
												{u.lastMessage || "Click to start chatting"}
											</span>
										</div>
									</button>
							))}
						</div>
					</div>
				)}

				<div className='p-4 border-t'>
					<div className='bg-gray-50 rounded-xl p-3 flex items-center gap-2'>
						<div className='w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-indigo-600'>
									{get_initials(auth.user?.fullName ?? "")}
						</div>
						{!sidebarCollapsed && (
							<div className='flex-1 min-w-0'>
								<p className='text-[12px] font-bold truncate'>
									{auth.user?.fullName}
								</p>
								<p className='text-[9px] text-gray-400'>
									{SOCKET_CONNECTED ? "🟢 Online" : "🔴 Offline"}
								</p>
							</div>
						)}
					</div>
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className='flex-1 flex flex-col bg-white'>
				<header className='h-20 border-b flex items-center justify-between px-8'>
					<h2 className='text-[20px] font-bold capitalize'>{activeTab}</h2>
					<div className='flex gap-4 items-center'>
						<Star />
						<button onClick={() => setShowProfileModal(true)}>
							<User size={20} />
						</button>
					</div>
				</header>

				<div className='flex-1 overflow-y-auto'>
					{/* CHAT TAB */}
					{activeTab === "chat" &&
						(SelectedUser ? (
							<div className='h-full flex flex-col'>
								<div className='p-4 border-b font-bold flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<img
											src={
												SelectedUser.image ||
												`https://ui-avatars.com/api/?name=${SelectedUser.fullName}`
											}
											className='w-10 h-10 rounded-full'
										/>
										<div>
											<p className='font-bold'>{SelectedUser.fullName}</p>
										</div>
									</div>
									<div className='flex gap-2'>
										<button className='p-2 hover:bg-gray-50 rounded'>
											<Phone size={20} />
										</button>
										<button className='p-2 hover:bg-gray-50 rounded'>
											<Video size={20} />
										</button>
										<button className='p-2 hover:bg-gray-50 rounded'>
											<MoreHorizontal size={20} />
										</button>
									</div>
								</div>

								<div className='flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50'>
									{messages.map((m, i) => (
										<div
											key={i}
											className={`flex ${
												m.senderId === auth.user?.id
													? "justify-end"
													: "justify-start"
											}`}
										>
											<div
												style={{
													padding: "16px",
													borderRadius: "20px",
													maxWidth: "400px",
													fontSize: "14px",
													backgroundColor:
														m.senderId === auth.user?.id
															? "#4f46e5"
															: "#ffffff",
													color:
														m.senderId === auth.user?.id
															? "#ffffff"
															: "#000000",
													boxShadow: "0px 4px 6px rgba(0,0,0,0.05)",
												}}
											>
												{m.message || m.content}
												<div
													style={{
														fontSize: "9px",
														marginTop: "4px",
														opacity: 0.7,
													}}
												>
													{format_Time(m.timestamp)}
												</div>
											</div>
										</div>
									))}
								</div>

								<div className='p-4 border-t'>
									<div className='flex gap-2 items-end'>
										<div className='flex-1 bg-gray-100 rounded-2xl p-2'>
											<Input
												value={newMessage}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
													setNewMessage(e.target.value)
												}
												placeholder='Message...'
												onKeyPress={(
													e: React.KeyboardEvent<HTMLInputElement>
												) => {
													if (e.key === "Enter") handleSendMessage();
												}}
												className='border-none bg-transparent'
											/>
										</div>
										<Button
											onClick={handleSendMessage}
											className='bg-indigo-600 text-white h-12 w-12 rounded-2xl'
										>
											<Send size={20} />
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className='h-full flex flex-col items-center justify-center p-8 bg-gray-50/50'>
								<div className='max-w-4xl w-full'>
									<div className='text-center mb-12'>
										<div className='w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm ring-1 ring-indigo-100'>
											<MessageCircle size={32} className='text-indigo-600' />
										</div>
										<h3 className='text-[30px] font-black text-gray-900 mb-2'>
											Who do you want to chat with?
										</h3>
										<p className='text-gray-500 font-medium'>
											Select an active connection to start messaging or search
											for new ones.
										</p>
									</div>

									<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
										{filteredUsers.map((u) => (
												<button
													key={u.id}
													onClick={() => {
														setSelectedUser(u);
														loadMessages(u.id);
													}}
													className='group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all text-left flex items-center gap-4'
												>
													<div className='relative'>
														<img
															src={
																u.image ||
																`https://ui-avatars.com/api/?name=${u.fullName}&background=random`
															}
															className='w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-sm'
														/>
														<div
															className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
																u.status === "online"
																	? "bg-green-500"
																	: "bg-gray-300"
															}`}
														></div>
													</div>
													<div className='flex-1 min-w-0'>
														<p className='font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors'>
															{u.fullName}
														</p>
														<p className='text-[12px] text-gray-500 font-medium uppercase tracking-wider'>
															{u.role || "Connection"}
														</p>
														<div className='mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg'>
															<div className='w-1 h-1 bg-indigo-600 rounded-full animate-pulse'></div>
															<span className='text-[10px] font-black text-indigo-600 uppercase tracking-tighter'>
																Open Chat
															</span>
														</div>
													</div>
												</button>
										))}
									</div>

									{filteredUsers.length === 0 && !loading && (
										<div className='text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100'>
											<p className='text-gray-400 font-bold'>
												No connections found matching &quot;{search_query}&quot;
											</p>
										</div>
									)}
								</div>
							</div>
						))}

					{/* HISTORY TAB */}
					{activeTab === "history" && (
						<div className='p-8 space-y-6'>
							<div className='flex items-center justify-between'>
								<h3 className='text-[24px] font-black'>Activity History</h3>
								<Button variant='secondary'>Export CSV</Button>
							</div>
							<HistoryTable rows={historyData} />
						</div>
					)}

					{/* PROFILE TAB */}
					{activeTab === "profile" && (
						<div className='p-12 max-w-2xl mx-auto'>
							<div className='text-center space-y-6'>
								<div className='relative inline-block'>
									<div className='w-32 h-32 rounded-full bg-indigo-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden'>
										<img
											src={
												auth.user?.image ||
												`https://ui-avatars.com/api/?name=${auth.user?.fullName}&size=200`
											}
											className='w-full h-full object-cover'
										/>
									</div>
									<button className='absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-xl border flex items-center justify-center text-indigo-600'>
										<Camera size={18} />
									</button>
								</div>

								<div>
									<h2 className='text-[30px] font-black'>
										{auth.user?.fullName}
									</h2>
									<p className='text-[18px] font-bold text-indigo-600 uppercase tracking-widest'>
										{auth.user?.role}
									</p>
									<p className='text-[14px] text-gray-400 mt-2'>
										{auth.user?.email}
									</p>
								</div>

								{profile_Edit_Mode ? (
									<div className='space-y-4 text-left'>
										<Input
											label='Full Name'
											defaultValue={auth.user?.fullName}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setTempProfileData({
													...temp_Profile_Data,
													fullName: e.target.value,
												})
											}
										/>
										<Input
											label='Specialty'
											defaultValue={auth.user?.specialty}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setTempProfileData({
													...temp_Profile_Data,
													specialty: e.target.value,
												})
											}
										/>
										<Input
											label='Work Location'
											defaultValue={auth.user?.workLocation}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setTempProfileData({
													...temp_Profile_Data,
													workLocation: e.target.value,
												})
											}
										/>
										<Input
											label='Phone'
											defaultValue={auth.user?.phone}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setTempProfileData({
													...temp_Profile_Data,
													phone: e.target.value,
												})
											}
										/>
										<div className='flex gap-2'>
											<Button
												onClick={handleProfileUpdate}
												className='bg-indigo-600 text-white flex-1'
											>
												Save Changes
											</Button>
											<Button
												onClick={() => setProfileEditMode(false)}
												variant='secondary'
												className='flex-1'
											>
												Cancel
											</Button>
										</div>
									</div>
								) : (
									<div className='grid grid-cols-2 gap-4'>
										<div className='p-6 bg-white rounded-3xl border border-gray-100 text-left'>
											<p className='text-[10px] font-black text-gray-400 uppercase mb-4'>
												Contact Info
											</p>
											<div className='space-y-3'>
												<div className='flex items-center gap-3'>
													{/* Mail icon removed */}
													<span className='text-[14px] font-bold'>
														{auth.user?.email || "N/A"}
													</span>
												</div>
												<div className='flex items-center gap-3'>
													<Phone size={14} className='text-gray-300' />
													<span className='text-[14px] font-bold'>
														{auth.user?.phone || "N/A"}
													</span>
												</div>
											</div>
										</div>
										<div className='p-6 bg-white rounded-3xl border border-gray-100 text-left'>
											<p className='text-[10px] font-black text-gray-400 uppercase mb-4'>
												Professional
											</p>
											<div className='space-y-3'>
												<div className='flex items-center gap-3'>
													{/* Briefcase icon removed */}
													<span className='text-[14px] font-bold'>
														{auth.user?.specialty || "General"}
													</span>
												</div>
												<div className='flex items-center gap-3'>
													{/* MapPin icon removed */}
													<span className='text-[14px] font-bold'>
														{auth.user?.workLocation || "Remote"}
													</span>
												</div>
											</div>
										</div>
									</div>
								)}

								<Button
									onClick={() => setProfileEditMode(!profile_Edit_Mode)}
									className='w-full bg-gray-900 text-white'
								>
									{profile_Edit_Mode ? "Cancel Edit" : "✏️ Edit Profile"}
								</Button>
							</div>
						</div>
					)}

					{/* SETTINGS TAB */}
					{activeTab === "settings" && (
						<div className='p-12 max-w-4xl mx-auto space-y-8'>
							<section className='space-y-4'>
								<h4 className='text-[14px] font-black text-indigo-600 uppercase tracking-widest'>
									Preferences
								</h4>
								<div className='bg-white p-8 rounded-3xl border'>
									<h3 className='text-[20px] font-black mb-6'>App Settings</h3>
									<div className='space-y-6'>
										<div className='flex items-center justify-between'>
											<div>
												<p className='font-bold'>Dark Mode</p>
												<p className='text-[12px] text-gray-400'>
													Toggle between light and dark themes
												</p>
											</div>
											<button className='w-12 h-6 bg-gray-200 rounded-full relative'>
												<div className='absolute left-1 top-1 w-4 h-4 bg-white rounded-full'></div>
											</button>
										</div>
										<div className='flex items-center justify-between'>
											<div>
												<p className='font-bold'>Language</p>
												<p className='text-[12px] text-gray-400'>
													Select your preferred language
												</p>
											</div>
											<select className='border rounded-lg px-3 py-1 text-[14px]'>
												<option>English (US)</option>
												<option>Spanish</option>
												<option>French</option>
											</select>
										</div>
									</div>
								</div>
							</section>

							<section className='space-y-4'>
								<h4 className='text-[14px] font-black text-gray-400 uppercase tracking-widest'>
									Notification Settings
								</h4>
								<div className='bg-white p-6 rounded-3xl border space-y-4'>
									{[
										"Email Notifications",
										"Push Notifications",
										"SMS Alerts",
										"Desktop Alerts",
									].map((pref, idx) => (
										<div
											key={idx}
											className='flex items-center justify-between'
										>
											<span className='font-bold text-[14px]'>{pref}</span>
											<input
												type='checkbox'
												className='w-12 h-6'
												defaultChecked={idx % 2 === 0}
											/>
										</div>
									))}
								</div>
							</section>

							<section className='space-y-4'>
								<section className='bg-white p-8 rounded-3xl border'>
									<h4 className='text-[18px] font-black mb-6'>
										Security & Data
									</h4>
									<div className='space-y-4'>
										<button className='w-full p-4 bg-white rounded-2xl border text-left flex items-center justify-between hover:bg-gray-50'>
											<div className='flex items-center gap-3'>
												{/* Shield icon removed */}
												<span className='font-bold'>
													Two-Factor Authentication
												</span>
											</div>
											<span className='text-[12px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold'>
												ACTIVE
											</span>
										</button>
										<button className='w-full p-4 bg-white rounded-2xl border text-left flex items-center justify-between hover:bg-gray-50'>
											<div className='flex items-center gap-3'>
												<Lock size={20} className='text-indigo-600' />
												<span className='font-bold'>Change Password</span>
											</div>
										</button>
										<button className='w-full p-4 bg-white rounded-2xl border text-left flex items-center justify-between hover:bg-gray-50'>
											<div className='flex items-center gap-3'>
												<Download size={20} className='text-indigo-600' />
												<span className='font-bold'>Download My Data</span>
											</div>
										</button>
									</div>
								</section>
							</section>

							<Button className='w-full bg-indigo-600 text-white h-14 text-[18px]'>
								Save All Settings
							</Button>
						</div>
					)}

					{/* ANALYTICS TAB - Real Feature */}
					{activeTab === "analytics" && (
						<div className='p-8 space-y-8'>
							<div className='flex items-center justify-between'>
								<h3 className='text-[30px] font-black'>
									Performance Analytics
								</h3>
								<div className='flex gap-2'>
									<select className='border rounded-xl px-4 py-2 text-[14px]'>
										<option>Last 7 Days</option>
										<option>Last 30 Days</option>
										<option>Last 90 Days</option>
									</select>
									<Button variant='secondary'>
										<Download size={16} /> Export Report
									</Button>
								</div>
							</div>

							{/* Stats Grid */}
							<div className='grid grid-cols-4 gap-6'>
								<div
									style={{
										backgroundColor: "#ffffff",
										padding: "24px",
										borderRadius: "24px",
										border: "1px solid #e2e8f0",
										boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
										width: "100%",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: "16px",
										}}
									>
										<div
											style={{
												width: "48px",
												height: "48px",
												backgroundColor: "#eef2ff",
												borderRadius: "16px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<MessageCircle className='text-indigo-600' size={24} />
										</div>
										<span
											style={{
												fontSize: "12px",
												backgroundColor: "#ecfdf5",
												color: "#059669",
												padding: "4px 8px",
												borderRadius: "9999px",
												fontWeight: "700",
											}}
										>
											+12%
										</span>
									</div>
									<p
										style={{
											fontSize: "10px",
											fontWeight: "900",
											color: "#9ca3af",
											textTransform: "uppercase",
											letterSpacing: "0.1em",
										}}
									>
										Total Messages
									</p>
									<p
										style={{
											fontSize: "30px",
											fontWeight: "900",
											marginTop: "8px",
										}}
									>
										12,847
									</p>
								</div>
								<div className='bg-white p-6 rounded-3xl border shadow-sm'>
									<div className='flex items-center justify-between mb-4'>
										<div className='w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center'>
											<Phone className='text-green-600' size={24} />
										</div>
										<span className='text-[12px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold'>
											+8%
										</span>
									</div>
									<p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>
										Voice Calls
									</p>
									<p className='text-[30px] font-black mt-2'>892</p>
								</div>
								<div className='bg-white p-6 rounded-3xl border shadow-sm'>
									<div className='flex items-center justify-between mb-4'>
										<div className='w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center'>
											<Video className='text-purple-600' size={24} />
										</div>
										<span className='text-[12px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold'>
											-3%
										</span>
									</div>
									<p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>
										Video Calls
									</p>
									<p className='text-[30px] font-black mt-2'>324</p>
								</div>
								<div className='bg-white p-6 rounded-3xl border shadow-sm'>
									<div className='flex items-center justify-between mb-4'>
										<div className='w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center'>
											<Star className='text-orange-600' size={24} />
										</div>
										<span className='text-[12px] bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold'>
											+15%
										</span>
									</div>
									<p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>
										Satisfaction
									</p>
									<p className='text-[30px] font-black mt-2'>4.8</p>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-8'>
								<div className='bg-white p-8 rounded-3xl border shadow-sm'>
									<h4 className='font-black mb-6 uppercase text-gray-400 text-[12px] tracking-widest'>
										Monthly Message Volume
									</h4>
									<div className='h-64'>
										<Bar
											data={bar_chart_data}
											options={{ maintainAspectRatio: false }}
										/>
									</div>
								</div>
								<div className='bg-white p-8 rounded-3xl border shadow-sm'>
									<h4 className='font-black mb-6 uppercase text-gray-400 text-[12px] tracking-widest'>
										User Engagement
									</h4>
									<div className='h-64'>
										<Line
											data={line_chart_data}
											options={{ maintainAspectRatio: false }}
										/>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-3 gap-8'>
								<div className='bg-white p-8 rounded-3xl border shadow-sm'>
									<h4 className='font-black mb-6 uppercase text-gray-400 text-[12px] tracking-widest'>
										Message Distribution
									</h4>
									<div className='h-64 flex justify-center'>
										<Doughnut
											data={doughnut_chart_data}
											options={{ maintainAspectRatio: false }}
										/>
									</div>
								</div>
								<div className='col-span-2 bg-white p-8 rounded-3xl border shadow-sm'>
									<h4 className='font-black mb-6 uppercase text-gray-400 text-[12px] tracking-widest'>
										Skills & Metrics Distribution
									</h4>
									<div className='h-80 flex justify-center'>
										<Radar
											data={radar_chart_data}
											options={{
												maintainAspectRatio: false,
												scales: {
													r: {
														angleLines: { display: false },
														suggestedMin: 0,
														suggestedMax: 100,
													},
												},
											}}
										/>
									</div>
								</div>
							</div>

							<div className='grid grid-cols-2 gap-6'>
								<div className='bg-white p-6 rounded-3xl border'>
									<h4 className='font-bold mb-6'>Activity Summary</h4>
									<p className='text-[14px] text-gray-500'>
										This feature is under development.
									</p>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>

			{/* MODALS & OVERLAYS */}
			{showProfileModal && (
				<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4'>
					<div className='bg-white rounded-3xl p-8 w-full max-w-[500px] my-auto'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-[20px] font-black'>Profile Overview</h3>
							<button onClick={() => setShowProfileModal(false)}>
								<X size={24} />
							</button>
						</div>
						<div className='space-y-6 text-center'>
							<div className='w-24 h-24 bg-indigo-50 rounded-full mx-auto flex items-center justify-center'>
								<User size={40} className='text-indigo-600' />
							</div>
							<div>
								<p className='text-[20px] font-black'>{auth.user?.fullName}</p>
								<p className='text-[14px] text-gray-400 font-bold uppercase tracking-widest'>
									{auth.user?.role}
								</p>
							</div>
							<div className='bg-gray-50 p-4 rounded-2xl text-left space-y-2'>
								<p className='text-[12px] font-black text-gray-400 uppercase'>
									Email
								</p>
								<p className='text-[14px] font-bold'>{auth.user?.email}</p>
							</div>
							<Button
								onClick={() => setShowProfileModal(false)}
								className='w-full bg-indigo-600 text-white'
							>
								Close Profile
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function DashboardPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<DashboardContent />
		</Suspense>
	);
}
