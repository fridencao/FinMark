import { prisma } from '../config/database.js';

export async function getAllTemplates(type?: string, category?: string) {
  const where: any = {};
  if (type) where.type = type;
  if (category) where.category = category;

  return prisma.template.findMany({
    where,
    orderBy: { usageCount: 'desc' },
  });
}

export async function getTemplateById(id: string) {
  return prisma.template.findUnique({
    where: { id },
  });
}

export async function createTemplate(data: {
  name: string;
  type: string;
  content: string;
  variables: string[];
  category?: string;
  description?: string;
}) {
  return prisma.template.create({
    data,
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    content: string;
    variables: string[];
    category: string;
    description: string;
    status: string;
  }>
) {
  return prisma.template.update({
    where: { id },
    data,
  });
}

export async function deleteTemplate(id: string) {
  return prisma.template.delete({
    where: { id },
  });
}

export async function renderTemplate(id: string, variables: Record<string, string>) {
  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  let content = template.content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    content = content.replace(regex, value);
  });

  await prisma.template.update({
    where: { id },
    data: {
      usageCount: {
        increment: 1,
      },
    },
  });

  return {
    ...template,
    renderedContent: content,
  };
}

export async function duplicateTemplate(id: string, newName: string) {
  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return prisma.template.create({
    data: {
      name: newName,
      type: template.type,
      content: template.content,
      variables: template.variables,
      category: template.category,
      description: template.description,
      isSystem: false,
    },
  });
}
