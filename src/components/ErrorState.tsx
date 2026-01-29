interface ErrorStateProps {
    message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full">
                <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Connection Error</h3>
                            <p className="text-sm text-muted-foreground">{message}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
