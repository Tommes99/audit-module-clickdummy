import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";

const integrations = [
  { title: "REST-API und Webhooks bei Statuswechseln", text: "Audits, Feststellungen und Maßnahmen sind über eine API les- und schreibbar. Webhooks melden Statuswechsel an Drittsysteme, etwa an Ticket- oder Dokumentenlenkungssysteme." },
  { title: "SSO und Gastzugänge für externe Auditor:innen", text: "Die Anmeldung läuft über das Identitätssystem des Unternehmens. Externe Auditor:innen erhalten befristete Gastzugänge, die auf ihr Audit begrenzt sind." },
  { title: "Excel-Import bestehender Checklisten mit Mapping auf Normkapitel", text: "Vorhandene Checklisten werden aus Excel übernommen. Eine Zuordnungsmaske verknüpft jede Frage mit einem Normkapitel, bevor sie als Fragenkatalog gespeichert wird." },
  { title: "PDF-Export mit Signatur", text: "Freigegebene Berichte werden als PDF exportiert und digital signiert. Der Hash des Berichts wird im Dokument ausgewiesen." },
  { title: "Lieferantenportal mit Selbstauskunft", text: "Lieferanten beantworten Selbstauskünfte in einem eigenen Zugang. Die Antworten fließen als Nachweise in das Lieferantenaudit ein." },
  { title: "Offline-Modus für die Durchführung vor Ort", text: "Checklisten lassen sich in der Halle ohne Netzverbindung bewerten. Bewertungen, Notizen und Fotos werden bei der nächsten Verbindung synchronisiert." },
  { title: "Übergabe von Kennzahlen an das ESG-Reporting", text: "Kennzahlen aus Audits und Maßnahmen, etwa offene Abweichungen und Umsetzungsquoten, werden an das ESG-Reporting übergeben." },
];

/** Vermerk als dezentes Badge, der Text bleibt vorhanden (CLAUDE.md Abschnitt 13) */
const CONCEPT_NOTE = "Im Konzept beschrieben, nicht Teil des Clickdummys";

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Integrationen" help="integrations.page" />
      <Panel padded={false}>
        <ul className="divide-y divide-border">
          {integrations.map((i) => (
            <li key={i.title} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">{i.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{i.text}</p>
              </div>
              <span className="inline-flex h-5 w-fit shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-muted/60 px-2 text-xs text-muted-foreground">
                {CONCEPT_NOTE}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
