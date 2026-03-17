import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // 调用外部的错误处理回调
    this.props.onError?.(error, errorInfo);

    // 可以在这里添加错误上报逻辑
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定义 fallback，使用 fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认的错误 UI
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-900">
                  出错了
                </h2>
                <p className="text-sm text-slate-500">
                  组件渲染时发生错误，请尝试刷新页面或联系客服
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="text-left p-4 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 max-h-48 overflow-auto">
                  <p className="font-bold mb-2">错误详情：</p>
                  <p className="text-red-600">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <p className="mt-2 text-slate-500">
                      {this.state.errorInfo.componentStack}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="px-4 py-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-indigo-600 text-white"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  刷新页面
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
