import { MasterAgent, InsightAgent } from '../src/agents/index.js';

async function testAgents() {
  console.log('=== Agent Service Integration Tests ===\n');

  console.log('Test 1: Insight Agent (mock mode)');
  const insight = new InsightAgent();
  insight.setLanguage('zh');
  const insightResult = await insight.analyze('推广新发ESG基金');
  console.log('  Result:', insightResult.content.slice(0, 80) + '...');
  console.assert(!insightResult.error, 'Insight should not error');

  console.log('\nTest 2: Master Agent Orchestration (mock mode)');
  const master = new MasterAgent();
  const orchestration = await master.orchestrate({
    goal: '提升本季度高净值客户理财产品转化率',
    budget: 50000,
    channels: ['短信', '企微', 'APP'],
    lang: 'zh',
  });
  console.log('  Orchestration complete');
  console.log('  - Master:', orchestration.master?.content?.slice(0, 50));
  console.log('  - Insight:', orchestration.insight?.content?.slice(0, 50));
  console.log('  - Segment:', orchestration.segment?.content?.slice(0, 50));
  console.log('  - Content:', orchestration.content?.content?.slice(0, 50));
  console.log('  - Compliance:', orchestration.compliance?.content?.slice(0, 50));
  console.log('  - Strategy:', orchestration.strategy?.content?.slice(0, 50));
  console.log('  - Analyst:', orchestration.analyst?.content?.slice(0, 50));

  console.log('\n=== All tests passed! ===');
}

testAgents().catch(console.error);
