import AuditoriaClient from "@/components/auditoria/auditoria-client";
import { getAuditoriaLogs } from "@/lib/data";

export default async function AuditoriaPage() {
  const logs = await getAuditoriaLogs();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">
          Registros de Auditoría
        </h1>
      </div>
      <AuditoriaClient initialData={logs} />
    </main>
  );
}
