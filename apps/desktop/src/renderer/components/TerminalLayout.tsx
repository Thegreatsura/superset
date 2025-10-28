import { useEffect, useState } from "react";
import type { GridLayout, GridTerminal } from "shared/types";
import Terminal from "./Terminal";

interface TerminalLayoutProps {
    layout: GridLayout;
    workingDirectory: string;
}

interface TerminalInstanceProps {
    terminal: GridTerminal;
    workingDirectory: string;
}

function TerminalInstance({ terminal, workingDirectory }: TerminalInstanceProps) {
    const [terminalId, setTerminalId] = useState<string | null>(null);

    useEffect(() => {
        // Create terminal instance
        const createTerminal = async () => {
            try {
                const id = await window.ipcRenderer.invoke<string>("terminal-create", {
                    cwd: workingDirectory,
                });
                setTerminalId(id);

                // Execute startup command if specified
                if (terminal.command && id) {
                    setTimeout(() => {
                        window.ipcRenderer.invoke("terminal-execute-command", {
                            id,
                            command: terminal.command,
                        });
                    }, 500); // Small delay to ensure terminal is ready
                }
            } catch (error) {
                console.error("Failed to create terminal:", error);
            }
        };

        createTerminal();

        // Cleanup
        return () => {
            if (terminalId) {
                window.ipcRenderer.invoke("terminal-kill", terminalId);
            }
        };
    }, [workingDirectory, terminal.command]);

    return (
        <div className="w-full h-full">
            <Terminal />
        </div>
    );
}

export default function TerminalLayout({
    layout,
    workingDirectory,
}: TerminalLayoutProps) {
    // Safety check: ensure layout has the expected structure
    if (!layout || !layout.terminals || !Array.isArray(layout.terminals)) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <p>Invalid layout structure</p>
                    <p className="text-sm text-gray-500 mt-2">Please rescan worktrees or create a new screen</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full h-full gap-1 p-1"
            style={{
                display: 'grid',
                gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
            }}
        >
            {layout.terminals.map((terminal) => (
                <div
                    key={terminal.id}
                    className="overflow-hidden rounded border border-neutral-800"
                    style={{
                        gridRow: `${terminal.row + 1} / span ${terminal.rowSpan || 1}`,
                        gridColumn: `${terminal.col + 1} / span ${terminal.colSpan || 1}`,
                    }}
                >
                    <TerminalInstance terminal={terminal} workingDirectory={workingDirectory} />
                </div>
            ))}
        </div>
    );
}
