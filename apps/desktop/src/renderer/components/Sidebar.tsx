import { ChevronRight, GitBranch, Menu, Plus, SquareTerminal } from "lucide-react";
import { useState } from "react";
import type { Workspace } from "shared/types";
import { Button } from "./ui/button";

interface SidebarProps {
	workspace: Workspace | null;
	onCollapse: () => void;
	onScreenSelect: (worktreeId: string, screenId: string) => void;
	onWorktreeCreated?: () => void;
	selectedScreenId?: string;
}

export function Sidebar({
	workspace,
	onCollapse,
	onScreenSelect,
	onWorktreeCreated,
	selectedScreenId,
}: SidebarProps) {
	const [expandedWorktrees, setExpandedWorktrees] = useState<Set<string>>(
		new Set(),
	);
	const [isCreatingWorktree, setIsCreatingWorktree] = useState(false);
	const [showWorktreeModal, setShowWorktreeModal] = useState(false);
	const [branchName, setBranchName] = useState("");

	const toggleWorktree = (worktreeId: string) => {
		setExpandedWorktrees((prev) => {
			const next = new Set(prev);
			if (next.has(worktreeId)) {
				next.delete(worktreeId);
			} else {
				next.add(worktreeId);
			}
			return next;
		});
	};

	const handleCreateWorktree = () => {
		console.log("[Sidebar] New Worktree button clicked");
		setShowWorktreeModal(true);
	};

	const handleSubmitWorktree = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!workspace || !branchName.trim()) return;

		console.log("[Sidebar] Creating worktree:", {
			branchName,
			createBranch: true,
		});
		setIsCreatingWorktree(true);

		try {
			const result = (await window.ipcRenderer.invoke("worktree-create", {
				workspaceId: workspace.id,
				branch: branchName.trim(),
				createBranch: true,
			})) as { success: boolean; error?: string };

			if (result.success) {
				console.log("[Sidebar] Worktree created successfully");
				setShowWorktreeModal(false);
				setBranchName("");
				onWorktreeCreated?.();
			} else {
				console.error("[Sidebar] Failed to create worktree:", result.error);
				alert(`Failed to create worktree: ${result.error || "Unknown error"}`);
			}
		} catch (error) {
			console.error("[Sidebar] Error creating worktree:", error);
			alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsCreatingWorktree(false);
		}
	};

	const handleCancelWorktree = () => {
		setShowWorktreeModal(false);
		setBranchName("");
	};

	return (
		<div className="flex flex-col h-full w-64 select-none bg-neutral-900 text-neutral-300 border-r border-neutral-800">
			{/* Top Section - Matches window controls height */}
			<div
				className="flex items-center border-b border-neutral-800"
				style={
					{
						height: "48px",
						paddingLeft: "88px",
						WebkitAppRegion: "drag",
					} as React.CSSProperties
				}
			>
				<div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
					<Button variant="ghost" size="icon-sm" onClick={onCollapse}>
						<Menu size={16} />
					</Button>
				</div>
			</div>

			{/* Worktrees Section */}
			<div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
				{!workspace && (
					<div className="text-sm text-gray-500 px-3 py-2">No workspace open</div>
				)}

				{workspace && (!workspace.worktrees || workspace.worktrees.length === 0) && (
					<div className="text-sm text-gray-500 px-3 py-2">
						No worktrees yet. Create one to get started.
					</div>
				)}

				{workspace?.worktrees?.map((worktree) => {
					const isExpanded = expandedWorktrees.has(worktree.id);
					return (
						<div key={worktree.id} className="space-y-1">
							{/* Worktree Header */}
							<Button
								variant="ghost"
								size="sm"
								onClick={() => toggleWorktree(worktree.id)}
								className="w-full h-8 px-3 pb-1 font-normal"
								style={{ justifyContent: "flex-start" }}
							>
								<ChevronRight
									size={12}
									className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
								/>
								<GitBranch size={14} className="opacity-70" />
								<span className="truncate flex-1 text-left">{worktree.branch}</span>
							</Button>

							{/* Screens List */}
							{isExpanded && (
								<div className="ml-6 space-y-1">
									{(worktree.screens || []).map((screen) => (
										<Button
											key={screen.id}
											variant="ghost"
											size="sm"
											onClick={() => onScreenSelect(worktree.id, screen.id)}
											className={`w-full h-8 px-3 font-normal ${
												selectedScreenId === screen.id
													? "bg-neutral-800 border border-neutral-700"
													: ""
											}`}
											style={{ justifyContent: "flex-start" }}
										>
											<SquareTerminal size={14} />
											<span className="truncate">{screen.name}</span>
										</Button>
									))}
								</div>
							)}
						</div>
					);
				})}

				{/* Create Worktree Button */}
				{workspace && (
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCreateWorktree}
						disabled={isCreatingWorktree}
						className="w-full h-8 px-3 font-normal border border-dashed border-neutral-700 mt-3"
						style={{ justifyContent: "flex-start" }}
					>
						<Plus size={16} />
						<span>{isCreatingWorktree ? "Creating..." : "New Worktree"}</span>
					</Button>
				)}
			</div>

			{/* Create Worktree Modal */}
			{showWorktreeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-neutral-800 rounded-lg shadow-xl p-6 w-96">
						<h3 className="text-lg font-semibold mb-4">Create New Worktree</h3>

						<form onSubmit={handleSubmitWorktree} className="space-y-4">
							<div>
								<label
									htmlFor="branchName"
									className="block text-sm font-medium mb-2"
								>
									New Branch Name
								</label>
								<input
									id="branchName"
									type="text"
									value={branchName}
									onChange={(e) => setBranchName(e.target.value)}
									placeholder="feature/my-branch"
									className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none focus:border-blue-500"
									autoFocus
									required
								/>
								<p className="text-xs text-gray-400 mt-1">
									A new branch will be created from the current branch
								</p>
							</div>

							<div className="flex justify-end gap-3 mt-6">
								<Button
									type="button"
									variant="ghost"
									onClick={handleCancelWorktree}
									disabled={isCreatingWorktree}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isCreatingWorktree || !branchName.trim()}
									className="bg-blue-600 hover:bg-blue-700"
								>
									{isCreatingWorktree ? "Creating..." : "Create"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
