import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@finmark.com',
      password: await bcrypt.hash('admin123', 12),
      name: 'Administrator',
      role: 'admin',
    },
  });
  console.log(`Admin: ${admin.username}`);

  const scenarios = [
    { title: '流失挽回', goal: '识别近30天资产下降超过30%的客户并进行挽回营销', category: 'recovery' as const, icon: 'Users', color: 'bg-rose-50', complianceScore: 98, riskLevel: 'low', isCustom: false },
    { title: '新发基金推广', goal: '针对有理财经验且风险偏好为中高风险的客户推广新发ESG基金', category: 'growth' as const, icon: 'Zap', color: 'bg-indigo-50', complianceScore: 95, riskLevel: 'medium', isCustom: false },
    { title: '信用卡分期提升', goal: '筛选有大额消费记录但未办理分期的客户，推送分期优惠券', category: 'growth' as const, icon: 'TrendingUp', color: 'bg-emerald-50', complianceScore: 99, riskLevel: 'low', isCustom: false },
    { title: '个人养老金开户', goal: '针对符合开户条件且未开立养老金账户的代发工资客户进行推广', category: 'acquisition' as const, icon: 'ShieldCheck', color: 'bg-orange-50', complianceScore: 97, riskLevel: 'low', isCustom: false },
  ];

  for (const s of scenarios) {
    await prisma.scenario.upsert({
      where: { id: s.title },
      update: {},
      create: { id: s.title, ...s },
    });
  }
  console.log(`Seeded ${scenarios.length} scenarios`);

  const atoms = [
    { name: '限时加息优惠', type: 'hook' as const, description: '对新客户推出7天限时年化收益率提升0.5%的优惠', successRate: 85, tags: ['新客', '加息', '限时'], scenarios: ['acquisition'] },
    { name: '生日关怀礼包', type: 'hook' as const, description: '在客户生日当月发放专属理财产品优惠券', successRate: 72, tags: ['生日', '关怀', '优惠券'], scenarios: ['mature', 'growth'] },
    { name: '企业微信触达', type: 'channel' as const, description: '通过企业微信发送个性化产品推荐消息', successRate: 68, tags: ['企微', '消息', '自动化'], scenarios: ['acquisition', 'growth', 'recovery'] },
    { name: 'APP弹窗推送', type: 'channel' as const, description: '在手机银行APP首页投放精准广告弹窗', successRate: 55, tags: ['APP', '弹窗', '展示'], scenarios: ['growth', 'mature'] },
    { name: '合规风险提示', type: 'risk' as const, description: '在产品介绍页面强制展示风险揭示书', successRate: 100, tags: ['合规', '风险', '必读'], scenarios: ['acquisition', 'growth'] },
  ];

  for (const a of atoms) {
    await prisma.atom.upsert({
      where: { id: a.name },
      update: {},
      create: { id: a.name, ...a },
    });
  }
  console.log(`Seeded ${atoms.length} atoms`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
