'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 rounded-lg border border-red-100 bg-red-50 text-red-900 text-center">
            <h3 className="text-md font-semibold">Chart Rendering Failed</h3>
            <p className="text-xs text-red-600 mt-1">
              {this.state.error?.message || 'An unexpected error occurred while drawing the chart.'}
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
