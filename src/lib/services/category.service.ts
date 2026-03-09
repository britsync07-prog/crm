import { prisma } from "@/lib/db";

export class CategoryService {
  static async getCategories(userId: string) {
    const categoryModel = (prisma as any).category;
    if (!categoryModel) return [];
    
    return await categoryModel.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  static async findOrCreateCategory(userId: string, name: string) {
    const categoryModel = (prisma as any).category;
    if (!categoryModel) throw new Error("Category model not initialized");

    const existing = await categoryModel.findFirst({
      where: { userId, name },
    });

    if (existing) return existing;

    return await categoryModel.create({
      data: {
        userId,
        name,
      },
    });
  }
}
