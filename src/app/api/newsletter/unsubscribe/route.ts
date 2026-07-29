import { prisma } from "@/lib/db";
import { verifyUnsubscribeSignature } from "@/lib/unsubscribe";

export async function POST(req: Request) {
  try {
    const { uid, sig } = await req.json();

    if (!uid || !sig) {
      return Response.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (!verifyUnsubscribeSignature(uid, sig)) {
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: uid },
      data: { newsletterOptedIn: false },
    });

    return Response.json({ success: true, email: user.email });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
