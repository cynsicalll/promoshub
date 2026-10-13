import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/notes — list all notes
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const notes = await db.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(notes);
}

// POST /api/notes — create a new note
export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const note = await db.note.create({
    data: {
      title: body.title || "Untitled",
      content: body.content || "",
      color: body.color || "default",
    },
  });
  return NextResponse.json(note, { status: 201 });
}

// PUT /api/notes — update a note
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.pinned !== undefined) updateData.pinned = data.pinned;

  const note = await db.note.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(note);
}

// DELETE /api/notes?id=xxx
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.note.delete({ where: { id } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
