import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class TestErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
    console.error('Test Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div data-testid="error-boundary">
          <h2>Test Error Occurred</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper for tests that may have component errors
export const withErrorBoundary = (
  component: ReactNode, 
  options: { onError?: (error: Error, errorInfo: any) => void } = {}
) => (
  <TestErrorBoundary onError={options.onError}>
    {component}
  </TestErrorBoundary>
)