import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DocuSphere React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    localStorage.removeItem('dms_token');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6 text-[#172033]" style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}>
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-[#D9DEE7] p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FEF3D6] text-[#B7791F] flex items-center justify-center mx-auto mb-4 border border-[#F6E0B5]">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-[#172033] mb-2">Application Encountered an Error</h2>
            <p className="text-sm text-[#667085] mb-6">
              An unexpected issue occurred while rendering the page. You can reload the page or reset your local session.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-[#F8F9FA] rounded border border-[#E9ECEF] text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-[#D9383A] font-semibold">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[11px] font-mono text-[#667085] mt-2 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3157D5] hover:bg-[#2745B0] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleResetSession}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F4F5F7] text-[#667085] hover:text-[#172033] border border-[#D9DEE7] text-xs font-semibold rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
