import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`card ${className}`} onClick={onClick} role={onClick ? "button" : undefined}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

export function Button({
  children, onClick, variant = "primary", type = "button", disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "small";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-${variant}`}>
      {children}
    </button>
  );
}

export function Field({
  label, children, hint, help,
}: { label: ReactNode; children: ReactNode; hint?: string; help?: string }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {help && (
          <button
            type="button"
            className="help-btn"
            title="Cliquer pour l'aide"
            aria-label={`Aide : ${typeof label === "string" ? label : "champ"}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowHelp(true); }}
          >
            ?
          </button>
        )}
      </span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
      {showHelp && help && (
        <Modal title="Comment remplir ce champ ?" onClose={() => setShowHelp(false)}>
          <p className="help-text">{help}</p>
        </Modal>
      )}
    </label>
  );
}

export function Modal({
  title, children, onClose,
}: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

export function Badge({ severity }: { severity: "info" | "attention" | "urgent" }) {
  const label = severity === "urgent" ? "urgent" : severity === "attention" ? "à surveiller" : "info";
  return <span className={`badge badge-${severity}`}>{label}</span>;
}
