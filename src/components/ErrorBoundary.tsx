import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, textAlign: "center", fontFamily: "system-ui", paddingTop: "20vh" }}>
          <h2 style={{ color: "#2d6a4f" }}>🌱 Oups, l'application a rencontré un problème</h2>
          <p style={{ color: "#6b7f76", fontSize: 14, wordBreak: "break-word" }}>
            {String(this.state.error.message ?? this.state.error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: "12px 22px",
              borderRadius: 999,
              border: "none",
              background: "#40916c",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
