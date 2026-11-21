import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Card, EmptyState, SectionTitle } from "../components/ui";

function exportData(): void {
  void (async () => {
    const data: Record<string, unknown[]> = {};
    for (const name of db.tables.map((t) => t.name)) {
      data[name] = await db.table(name).toArray();
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jardinconnect-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  })();
}

function importData(file: File): void {
  void (async () => {
    const text = await file.text();
    const data = JSON.parse(text) as Record<string, unknown[]>;
    await db.transaction("rw", db.tables, async () => {
      for (const t of db.tables) {
        if (Array.isArray(data[t.name])) {
          await t.clear();
          await t.bulkAdd(data[t.name] as never[]);
        }
      }
    });
    window.location.reload();
  })();
}

export function AboutScreen() {
  const sources = useLiveQuery(() => db.data_sources.toArray());

  return (
    <div>
      <SectionTitle>ℹ️ À propos de JardinConnect</SectionTitle>
      <Card>
        <p>
          <strong>JardinConnect</strong> est un copilote de potager <strong>100 % permaculture</strong> :
          vous dites ce que vous voulez récolter, l'appli calcule le nombre de pieds, génère un
          planning mois par mois (semis, repiquage, paillage, engrais verts, repos hivernal) et
          croise la vraie météo avec vos réserves d'eau et vos parcelles.
        </p>
        <p className="muted">
          🌼 <strong>100 % naturel, en aucun cas chimique :</strong> JardinConnect ne propose que
          des remèdes naturels et préventifs (purin d'ortie, purin de consoude, savon noir,
          décoction de prêle, paillage, barrières physiques, compagnonnage). L'option
          « chimique » n'existe pas dans l'application.
        </p>
        <p className="muted">
          Tout fonctionne <strong>hors ligne</strong> : vos données restent sur votre appareil,
          aucun compte n'est requis. La météo se met à jour uniquement si vous le demandez.
        </p>
      </Card>

      <SectionTitle>🗑️ Sources et licences des données</SectionTitle>
      {(sources ?? []).length === 0 ? (
        <EmptyState text="Aucune source de données enregistrée." />
      ) : (
        <div className="list">
          {(sources ?? []).map((s) => (
            <Card key={s.id}>
              <strong>{s.name}</strong>
              <p className="muted">{s.kind} · origine : {s.origin}</p>
              <p className="muted">Licence : {s.licence}</p>
              <p className="muted">Importé le {s.importedAt.slice(0, 10)}</p>
              {s.notes && <p className="muted">{s.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <SectionTitle>💾 Sauvegarde de vos données</SectionTitle>
      <Card>
        <p className="muted">
          Vos données vivent uniquement dans votre navigateur. Exportez régulièrement
          une sauvegarde (fichier JSON réimportable sur n'importe quel appareil).
        </p>
        <div className="row-actions">
          <button className="btn btn-primary" onClick={exportData}>⬇️ Exporter</button>
          <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
            ⬆️ Importer
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
              }}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
