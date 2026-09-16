import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const normalized = username.toLowerCase().trim();

    // 1. Check custom bookingSlug in calendarSettings
    let hostUser: any = null;
    let settings: any = null;

    const settingsMatch = await prisma.calendarSettings.findFirst({
      where: { bookingSlug: normalized },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
    });

    if (settingsMatch?.user) {
      hostUser = settingsMatch.user;
      settings = settingsMatch;
    } else {
      // 2. Check user id
      const userById = await prisma.user.findUnique({
        where: { id: username },
        select: { id: true, name: true, email: true, image: true },
      });

      if (userById) {
        hostUser = userById;
        settings = await prisma.calendarSettings.findUnique({ where: { userId: userById.id } });
      } else {
        // 3. Match email prefix or name slug
        const allUsers = await prisma.user.findMany({
          select: { id: true, name: true, email: true, image: true },
        });

        const matched = allUsers.find((u) => {
          const emailPrefix = u.email.split("@")[0].toLowerCase();
          const nameSlug = u.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return emailPrefix === normalized || nameSlug === normalized;
        });

        if (matched) {
          hostUser = matched;
          settings = await prisma.calendarSettings.findUnique({ where: { userId: matched.id } });
        }
      }
    }

    if (!hostUser) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const eventTypes = await prisma.eventType.findMany({
      where: { userId: hostUser.id, isActive: true },
      orderBy: { duration: "asc" },
    });

    return NextResponse.json({
      host: {
        id: hostUser.id,
        name: hostUser.name || "Host",
        email: hostUser.email,
        image: hostUser.image,
        timeZone: settings?.timeZone || "UTC",
        bookingSlug: settings?.bookingSlug || normalized,
      },
      eventTypes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
