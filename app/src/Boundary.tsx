import { Component, type ReactNode } from 'react'

/** Keeps one failing part (3D scene, onboarding) from taking the whole console down. */
export class Boundary extends Component<{ children: ReactNode; label: string; onReset?: () => void }, { err: string | null }> {
  state = { err: null as string | null }
  static getDerivedStateFromError(e: unknown) { return { err: e instanceof Error ? e.message : String(e) } }
  componentDidCatch(e: unknown) { console.error(`[${this.props.label}]`, e) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="boundary" role="alert">
        <p className="eyebrow">[{this.props.label}] · UNAVAILABLE</p>
        <p>{this.state.err}</p>
        <button className="btn ghost sm" onClick={() => { this.setState({ err: null }); this.props.onReset?.() }}>Retry</button>
      </div>
    )
  }
}
