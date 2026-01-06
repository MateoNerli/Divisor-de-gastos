"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type InviteInfo = {
  group: { id: string; name: string };
  invitedEmail: string | null;
  expiresAt: string;
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const inviteResponse = await fetch(`/api/invites/${token}`);
      if (!inviteResponse.ok) {
        const payload = await inviteResponse.json().catch(() => ({}));
        setError(payload.error || "No se pudo cargar la invitacion.");
        setLoading(false);
        return;
      }
      setInvite(await inviteResponse.json());

      const meResponse = await fetch("/api/me");
      setIsAuthenticated(meResponse.ok);
      setLoading(false);
    };

    load();
  }, [token]);

  const handleAccept = async () => {
    setError("");
    const response = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo aceptar la invitacion.");
      return;
    }

    const payload = await response.json();
    router.replace(`/groups/${payload.groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando invitacion...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        {error}
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold mb-2">Invitacion</h1>
        <p className="text-sm text-gray-600">
          Te invitaron a unirte al grupo{" "}
          <span className="font-medium">{invite.group.name}</span>
        </p>
        {invite.invitedEmail && (
          <p className="mt-2 text-xs text-gray-500">
            Invitacion destinada a: {invite.invitedEmail}
          </p>
        )}
        {!isAuthenticated ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>Necesitas iniciar sesion para aceptar.</p>
            <Link className="text-blue-600 hover:underline" href="/login">
              Ir a login
            </Link>
          </div>
        ) : (
          <button
            onClick={handleAccept}
            className="mt-4 w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Aceptar invitacion
          </button>
        )}
      </div>
    </div>
  );
}



