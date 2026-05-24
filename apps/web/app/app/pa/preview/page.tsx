import { getTeacherProfileForPa, getPaEvidences } from "@/lib/queries/pa";
import { PaPreviewClient } from "@/app/app/pa/preview-client";

export default async function PaPreviewPage() {
  const [profile, evidences] = await Promise.all([
    getTeacherProfileForPa(),
    getPaEvidences()
  ]);

  return (
    <main className="phone-shell" style={{ maxWidth: "800px" }}>
      <PaPreviewClient profile={profile} evidences={evidences} />
    </main>
  );
}
