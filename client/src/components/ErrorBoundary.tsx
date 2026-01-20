import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a Google Translate related error
    const isGoogleTranslateError =
      error.message.includes("removeChild") ||
      error.message.includes("removeChildFromContainer") ||
      error.message.includes("updateWorkInProgressHook") ||
      error.message.includes("updateSyncExternalStore") ||
      error.message.includes("useBrowserLocation") ||
      error.stack?.includes("removeChild") ||
      error.stack?.includes("updateWorkInProgressHook") ||
      error.stack?.includes("updateSyncExternalStore") ||
      error.stack?.includes("useBrowserLocation");

    if (isGoogleTranslateError) {
      console.log("Google Translate DOM/hooks manipulation detected, auto-recovering...");
      // Don't show error for Google Translate errors
      // Force a re-render to recover from hooks errors
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
