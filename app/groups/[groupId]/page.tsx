"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type GroupDetail = {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
};

type GroupMember = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
};

type EventSummary = {
  id: string;
  name: string;
  participantCount: number;
  expenseCount: number;
};

type Category = {
  id: string;
  name: string;
};

export default function GroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [eventParticipants, setEventParticipants] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (!groupResponse.ok) {
        router.replace("/dashboard");
        return;
      }
      setGroup(await groupResponse.json());

      const memberResponse = await fetch(`/api/groups/${groupId}/members`);
      if (memberResponse.ok) {
        const data = await memberResponse.json();
        setMembers(data);
      }

      const eventResponse = await fetch(`/api/groups/${groupId}/events`);
      if (eventResponse.ok) {
        setEvents(await eventResponse.json());
      }

      const categoryResponse = await fetch(`/api/groups/${groupId}/categories`);
      if (categoryResponse.ok) {
        setCategories(await categoryResponse.json());
      }
    };

    load();
  }, [groupId, router]);

  useEffect(() => {
    if (members.length > 0 && eventParticipants.length === 0) {
      setEventParticipants(members.map((member) => member.id));
    }
  }, [members, eventParticipants.length]);

  const handleCreateEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!newEventName.trim()) {
      setError("Ingresa un nombre para el evento.");
      return;
    }

    const response = await fetch(`/api/groups/${groupId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newEventName,
        description: newEventDescription || undefined,
        participantIds: eventParticipants,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo crear el evento.");
      return;
    }

    const created = (await response.json()) as EventSummary;
    setEvents((prev) => [created, ...prev]);
    setNewEventName("");
    setNewEventDescription("");
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!newCategoryName.trim()) {
      setError("Ingresa un nombre para la Categoria.");
      return;
    }

    const response = await fetch(`/api/groups/${groupId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo crear la Categoria.");
      return;
    }

    const created = (await response.json()) as Category;
    setCategories((prev) => [created, ...prev]);
    setNewCategoryName("");
  };

  const toggleEventParticipant = (participantId: string) => {
    setEventParticipants((prev) => {
      if (prev.includes(participantId)) {
        return prev.filter((id) => id !== participantId);
      }
      return [...prev, participantId];
    });
  };

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInviteLink("");

    const response = await fetch(`/api/groups/${groupId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail || undefined,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "No se pudo crear la invitacion.");
      return;
    }

    const payload = await response.json();
    setInviteLink(payload.inviteUrl);
    setInviteEmail("");
  };

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando grupo...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:underline"
            >
              Volver a grupos
            </Link>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <p className="text-sm text-gray-500">Rol: {group.role}</p>
          </div>
        </div>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Eventos</h2>
              <form className="space-y-3" onSubmit={handleCreateEvent}>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(event) => setNewEventName(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Ej: Vacaciones 2026"
                />
                <textarea
                  value={newEventDescription}
                  onChange={(event) => setNewEventDescription(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Descripcion (opcional)"
                  rows={3}
                />
                <div className="rounded border border-gray-200 p-3 text-sm">
                  <p className="font-medium mb-2">Participantes</p>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={eventParticipants.includes(member.id)}
                          onChange={() => toggleEventParticipant(member.id)}
                        />
                        <span>{member.name || member.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Crear evento
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay eventos todavia.
                  </p>
                ) : (
                  events.map((item) => (
                    <Link
                      key={item.id}
                      href={`/events/${item.id}`}
                      className="block rounded border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.participantCount} participantes \u00b7 {item.expenseCount} gastos
                          </p>
                        </div>
                        <span className="text-sm text-blue-600">
                          Ver evento
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Categorias</h2>
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleCreateCategory}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-2"
                  placeholder="Ej: Transporte"
                />
                <button
                  type="submit"
                  className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
                >
                  Agregar
                </button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <span className="text-sm text-gray-500">
                    No hay Categorias creadas.
                  </span>
                ) : (
                  categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      {category.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Miembros</h2>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded border border-gray-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {member.name || "Sin nombre"}
                      </p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-xs text-gray-500">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold mb-4">Invitar</h2>
              <form className="space-y-3" onSubmit={handleInvite}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  placeholder="Email (opcional)"
                />
                <button
                  type="submit"
                  className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Generar link
                </button>
              </form>
              {inviteLink && (
                <div className="mt-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 break-all">
                  {inviteLink}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



