import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const requireGroupMembership = async (
  userId: string,
  groupId: string
) => {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      groupId,
      deletedAt: null,
      group: { deletedAt: null },
    },
  });

  if (!membership) {
    return {
      membership: null,
      response: NextResponse.json(
        { error: "No tenes acceso al grupo." },
        { status: 403 }
      ),
    };
  }

  return { membership, response: null };
};

export const requireGroupAdmin = async (userId: string, groupId: string) => {
  const result = await requireGroupMembership(userId, groupId);
  if (result.response || !result.membership) {
    return result;
  }

  if (result.membership.role !== "ADMIN") {
    return {
      membership: null,
      response: NextResponse.json(
        { error: "Se requieren permisos de administrador." },
        { status: 403 }
      ),
    };
  }

  return result;
};

