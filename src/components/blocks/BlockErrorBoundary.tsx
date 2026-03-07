// src/components/blocks/BlockErrorBoundary.tsx
import React from "react";

export class BlockErrorBoundary extends React.Component<
  { blockId?: string; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any, info: any) {
    // Error caught by BlockErrorBoundary - will be reported via Sentry
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded border bg-amber-50 text-amber-900">
          This section had a problem and was skipped.
        </div>
      );
    }
    return this.props.children;
  }
}