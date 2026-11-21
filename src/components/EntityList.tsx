import { useState } from "react";
import { type Table } from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Button, Card, EmptyState, Field, Modal, SectionTitle } from "./ui";

export interface Option {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select" | "checkbox";
  required?: boolean;
  options?: Option[];
  placeholder?: string;
  step?: number;
  hint?: string;
}

type Row = Record<string, unknown>;

export function EntityList({
  table, fields, title, emptyText, toTitle, toSubtitle, defaultValues,
}: {
  table: Table<any, number>;
  fields: FieldDef[];
  title: string;
  emptyText: string;
  toTitle: (row: any) => string;
  toSubtitle?: (row: any) => string;
  defaultValues?: Record<string, unknown>;
}) {
  const rows = useLiveQuery(() => table.toArray(), []) ?? [];
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const startCreate = () => {
    const initial: Row = { ...defaultValues };
    for (const f of fields) {
      if (initial[f.name] === undefined) {
        if (f.type === "date") initial[f.name] = new Date().toISOString().slice(0, 10);
        if (f.type === "checkbox") initial[f.name] = true;
      }
    }
    setEditing(initial);
    setOpen(true);
  };

  return (
    <div>
      <div className="head-row">
        <SectionTitle>{title}</SectionTitle>
        <Button onClick={startCreate}>+ Ajouter</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="list">
          {rows.map((row) => (
            <Card key={row.id}>
              <button className="list-row-btn" onClick={() => { setEditing({ ...row }); setOpen(true); }}>
                <div className="list-text">
                  <strong>{toTitle(row)}</strong>
                  {toSubtitle && <span className="muted">{toSubtitle(row)}</span>}
                </div>
                <span className="chev">›</span>
              </button>
            </Card>
          ))}
        </div>
      )}
      {open && editing && (
        <EntityForm
          table={table}
          fields={fields}
          row={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

export function EntityForm({
  table, fields, row, onClose,
}: {
  table: Table<any, number>;
  fields: FieldDef[];
  row: Row;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Row>({ ...row });
  const isNew = row.id === undefined;

  const set = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const submit = async () => {
    for (const f of fields) {
      if (f.required && (values[f.name] === undefined || values[f.name] === "")) return;
    }
    const clean: Row = { ...values };
    for (const f of fields) {
      if ((f.type === "number") && (clean[f.name] === "" || clean[f.name] === undefined)) {
        delete clean[f.name];
      }
      if (f.type === "checkbox") clean[f.name] = Boolean(clean[f.name]);
    }
    if (isNew) await table.add(clean as any);
    else await table.update(row.id as number, clean as any);
    onClose();
  };

  return (
    <Modal title={isNew ? "Nouvel élément" : "Modifier"} onClose={onClose}>
      <div className="form">
        {fields.map((f) => (
          <Field key={f.name} label={f.label + (f.required ? " *" : "")} hint={f.hint}>
            {f.type === "textarea" ? (
              <textarea
                value={String(values[f.name] ?? "")}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : f.type === "select" ? (
              <select value={String(values[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">— choisir —</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : f.type === "checkbox" ? (
              <input
                type="checkbox"
                checked={Boolean(values[f.name])}
                onChange={(e) => set(f.name, e.target.checked)}
              />
            ) : (
              <input
                type={f.type}
                value={String(values[f.name] ?? "")}
                onChange={(e) => set(f.name, e.target.value)}
                step={f.step}
                placeholder={f.placeholder}
              />
            )}
          </Field>
        ))}
      </div>
      <div className="form-actions">
        {!isNew && (
          <Button
            variant="danger"
            onClick={async () => { await table.delete(row.id as number); onClose(); }}
          >
            Supprimer
          </Button>
        )}
        <div className="spacer" />
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={submit}>{isNew ? "Créer" : "Enregistrer"}</Button>
      </div>
    </Modal>
  );
}

export function refOptions(
  rows: { id?: number; name?: string; commonName?: string }[] | undefined,
  nameKey: "name" | "commonName" = "name",
): Option[] {
  return (rows ?? []).map((r) => ({
    value: String(r.id),
    label: (nameKey === "commonName" ? r.commonName : r.name) ?? "—",
  }));
}

export function useDexieCount(table: Table<any, number>): number | undefined {
  return useLiveQuery(() => db.table(table.name).count(), []);
}
