"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
};

type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  eventCount: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const meResponse = await fetch("/api/me");
      if (!meResponse.ok) {
        router.replace("/login");
        return;
      }
      const meData = (await meResponse.json()) as UserProfile;
      setUser(meData);

      const groupsResponse = await fetch("/api/groups");
      if (groupsResponse.ok) {
        const groupsData = (await groupsResponse.json()) as GroupSummary[];
        setGroups(groupsData);
      }
      setLoading(false);
    };

    load();
  }, [router]);

  const handleCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!newGroupName.trim()) {
      setError("Ingresa un nombre de grupo.");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error || "No se pudo crear el grupo.");
        return;
      }

      const created = (await response.json()) as GroupSummary;
      setGroups((prev) => [created, ...prev]);
      setNewGroupName("");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Hola {user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cerrar sesion
          </button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Crear grupo</h2>
          {error && (
            <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={handleCreateGroup}
          >
            <input
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              className="flex-1 rounded border border-gray-300 px-3 py-2"
              placeholder="Ej: Amigos"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {creating ? "Creando..." : "Crear"}
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Tus grupos</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500">
              Todavia no tenes grupos creados.
            </p>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block rounded border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-xs text-gray-500">
                        {group.memberCount} miembros {group.eventCount} eventos
                      </p>
                    </div>
                    <span className="text-sm text-blue-600">Ver grupo</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
