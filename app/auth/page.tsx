"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageCircle, Lock, Mail, Loader2, User } from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiClient } from "@/app/lib/apiClient";
import { setStoredAuth, getStoredAuth } from "@/app/lib/chatAuth";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

function AuthComponent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const mode = searchParams.get("mode") || "login";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [role, setRole] = useState("student");
	const [showPassword, set_show_password] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error_message, setErrorMessage] = useState("");
	const [formErrors, set_form_errors] = useState<{
		email?: string;
		password?: string;
		name?: string;
	}>({});

	useEffect(() => {
		const auth = getStoredAuth();
		if (auth?.token) router.replace("/dashboard");
	}, [router]);

	const validate_form = () => {
		const errors: { email?: string; password?: string; name?: string } = {};

		if (!email) {
			errors.email = "Email is required";
		} else if (!email.includes("@")) {
			errors.email = "Invalid email";
		}

		if (!password) {
			errors.password = "Password is required";
		} else if (password.length < 6) {
			errors.password = "Password must be at least 6 characters";
		}

		if (mode === "signup" && !fullName) {
			errors.name = "Name is required";
		}

		set_form_errors(errors);
		return Object.keys(errors).length === 0;
	};

	const HandleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validate_form()) return;

		setIsLoading(true);
		setErrorMessage("");

		try {
			const endpoint = mode === "login" ? "/auth/login" : "/auth/signup";
			const payload =
				mode === "login"
					? { email, password }
					: {
						email,
						password,
						fullName,
						role,
					  };

			const response = await apiClient.post(endpoint, payload);
			setStoredAuth({ user: response.data.user, token: response.data.token });
			router.replace("/dashboard");
		} catch (err: unknown) {
			const maybeAxios = err as { response?: { data?: { message?: string } } };
			setErrorMessage(maybeAxios.response?.data?.message || "Login failed");
		} finally {
			setIsLoading(false);
		}
	};

	const toggle_mode = () => {
		const newMode = mode === "login" ? "signup" : "login";
		router.push(`/auth?mode=${newMode}`);
	};

	return (
		<div
			className='min-h-screen flex items-center justify-center p-4 relative overflow-hidden'
			style={{
				background:
					"linear-gradient(to bottom right, #fafafa, rgba(99, 102, 241, 0.05))",
			}}
		>
			<img
				src='/background_2.svg'
				className='absolute top-[-10%] left-[-10%] w-[120%] h-[120%] object-cover opacity-5 pointer-events-none'
				alt='bg-svg-heavy'
			/>
			<img
				src='/background_2.png'
				className='absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] object-contain opacity-10 pointer-events-none'
				alt='bg-png-heavy'
			/>

			<div
				style={{
					width: "100%",
					maxWidth: "400px",
					position: "relative",
					zIndex: 10,
				}}
			>
				{/* Logo Section */}
				<div className='text-center' style={{ marginBottom: "32px" }}>
					<div style={{ display: "inline-block", position: "relative" }}>
						<div
							style={{
								position: "absolute",
								inset: 0,
								backgroundColor: "rgba(99, 102, 241, 0.3)",
								filter: "blur(32px)",
								borderRadius: "9999px",
							}}
						/>
						<div
							style={{
								position: "relative",
								display: "inline-flex",
								padding: "16px",
								borderRadius: "16px",
								background:
									"linear-gradient(to bottom right, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))",
								border: "1px solid rgba(99, 102, 241, 0.2)",
								marginBottom: "1rem",
							}}
						>
							<MessageCircle
								style={{ height: "40px", width: "40px", color: "#6366f1" }}
							/>
						</div>
					</div>
					<h1
						style={{
							fontSize: "1.875rem",
							fontWeight: "bold",
							marginTop: "16px",
						}}
					>
						{mode === "login" ? "Welcome back" : "Create account"}
					</h1>
					<p style={{ color: "#888", marginTop: "0.5rem" }}>
						{mode === "login"
							? "Sign in to continue to ChatConnect"
							: "Join ChatConnect today"}
					</p>
				</div>

				{/* Form Card */}
				<form
					onSubmit={HandleSubmit}
					style={{
						backgroundColor: "white",
						borderRadius: "16px",
						padding: "32px",
						boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
						border: "1px solid rgba(0, 0, 0, 0.05)",
					}}
				>
					{error_message && (
						<div
							style={{
								padding: "16px",
								borderRadius: "12px",
								backgroundColor: "rgba(239, 68, 68, 0.1)",
								border: "1px solid rgba(239, 68, 68, 0.3)",
								color: "#ef4444",
								fontSize: "14px",
								marginBottom: "20px",
							}}
						>
							{error_message}
						</div>
					)}

					{mode === "signup" && (
						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "14px",
									fontWeight: "500",
									marginBottom: "8px",
								}}
							>
								Full Name
							</label>
							<div style={{ position: "relative" }}>
								<User
									style={{
										position: "absolute",
										left: "16px",
										top: "50%",
										transform: "translateY(-50%)",
										height: "16px",
										width: "16px",
										color: "#888",
									}}
								/>
								<Input
									type='text'
									placeholder='John Doe'
									value={fullName}
									onChange={(e) => setFullName(e.target.value)}
									style={{ paddingLeft: "44px" }}
								/>
							</div>
							{formErrors.name && (
								<span style={{ color: "red", fontSize: "12px" }}>
									{formErrors.name}
								</span>
							)}
						</div>
					)}

					{mode === "signup" && (
						<div style={{ marginBottom: "20px" }}>
							<label
								style={{
									display: "block",
									fontSize: "14px",
									fontWeight: "500",
									marginBottom: "8px",
								}}
							>
								Role
							</label>
							<select
								value={role}
								onChange={(e) => setRole(e.target.value)}
								className='flex h-12 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500'
							>
								<option value='student'>Student</option>
								<option value='preceptor'>Preceptor</option>
							</select>
						</div>
					)}

					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								fontSize: "14px",
								fontWeight: "500",
								marginBottom: "8px",
							}}
						>
							Email
						</label>
						<div style={{ position: "relative" }}>
							<Mail
								style={{
									position: "absolute",
									left: "16px",
									top: "50%",
									transform: "translateY(-50%)",
									height: "16px",
									width: "16px",
									color: "#888",
								}}
							/>
							<Input
								type='email'
								placeholder='you@example.com'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								style={{ paddingLeft: "44px" }}
							/>
						</div>
						{formErrors.email && (
							<span style={{ color: "red", fontSize: "12px" }}>
								{formErrors.email}
							</span>
						)}
					</div>

					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								fontSize: "14px",
								fontWeight: "500",
								marginBottom: "8px",
							}}
						>
							Password
						</label>
						<div style={{ position: "relative" }}>
							<Lock
								style={{
									position: "absolute",
									left: "16px",
									top: "50%",
									transform: "translateY(-50%)",
									height: "16px",
									width: "16px",
									color: "#888",
								}}
							/>
							<Input
								type={showPassword ? "text" : "password"}
								placeholder='Enter your password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								style={{ paddingLeft: "44px", paddingRight: "44px" }}
							/>
							<button
								type='button'
								onClick={() => set_show_password(!showPassword)}
								style={{
									position: "absolute",
									right: "16px",
									top: "50%",
									transform: "translateY(-50%)",
									background: "none",
									border: "none",
									cursor: "pointer",
								}}
							>
								{showPassword ? (
									<FaEyeSlash style={{ color: "#888" }} />
								) : (
									<FaEye style={{ color: "#888" }} />
								)}
							</button>
						</div>
						{formErrors.password && (
							<span style={{ color: "red", fontSize: "12px" }}>
								{formErrors.password}
							</span>
						)}
					</div>

					{mode === "login" && (
						<div style={{ textAlign: "right", marginBottom: "20px" }}>
							<a href='#' style={{ fontSize: "14px", color: "#6366f1" }}>
								Forgot password?
							</a>
						</div>
					)}

					<Button
						type='submit'
						style={{ width: "100%", height: "48px", fontSize: "16px" }}
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2
								className='h-5 w-5 animate-spin'
								style={{ marginRight: "8px" }}
							/>
						) : null}
						{mode === "login" ? "Sign In" : "Create Account"}
					</Button>

					<p
						style={{
							textAlign: "center",
							fontSize: "14px",
							color: "#888",
							marginTop: "24px",
						}}
					>
						{mode === "login" ? (
							<>
								Don&apos;t have an account?{" "}
								<button
									type='button'
									onClick={toggle_mode}
									style={{
										color: "#6366f1",
										fontWeight: "600",
										background: "none",
										border: "none",
										cursor: "pointer",
									}}
								>
									Create account
								</button>
							</>
						) : (
							<>
								Already have an account?{" "}
								<button
									type='button'
									onClick={toggle_mode}
									style={{
										color: "#6366f1",
										fontWeight: "600",
										background: "none",
										border: "none",
										cursor: "pointer",
									}}
								>
									Sign in
								</button>
							</>
						)}
					</p>
				</form>
			</div>
		</div>
	);
}

export default function AuthPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AuthComponent />
		</Suspense>
	);
}
