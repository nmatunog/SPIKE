import { Component } from 'react';
import {
  isRecoverableDeployError,
  tryRecoverFromChunkLoadError,
} from '../lib/chunkLoadRecovery.js';

const RELOAD_KEY = 'spike_chunk_reload_once';

export class ChunkLoadErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(error) {
    if (isRecoverableDeployError(error)) {
      return { failed: true, error };
    }
    return null;
  }

  componentDidCatch(error) {
    if (tryRecoverFromChunkLoadError(error)) return;
    if (isRecoverableDeployError(error)) {
      this.setState({ failed: true, error });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">SPIKE needs a refresh</h1>
          <p className="max-w-md text-sm text-slate-600">
            A new version was deployed while this tab was open. Hard-refresh to load the latest
            files.
          </p>
          <button
            type="button"
            className="rounded-xl bg-[#8B0000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0000]"
            onClick={() => {
              try {
                sessionStorage.removeItem(RELOAD_KEY);
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Reload SPIKE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
