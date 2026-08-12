/**
 * 短信发送 Provider 抽象。
 *
 * 在生产环境会换成阿里云/腾讯云 SDK,这里给个 MockSmsProvider
 * 控制台打印验证码,本地开发直接能跑。
 */

export interface SmsProvider {
  /** 把验证码发到目标手机号。失败应 throw,由调用方决定降级策略 */
  send(phone: string, code: string): Promise<void>;
}

export class MockSmsProvider implements SmsProvider {
  async send(phone: string, code: string): Promise<void> {
    // 真实接入时这里替换为 SDK 调用。
    // 在 dev/test 模式下输出到日志,方便测试与本地演示抓验证码。
    console.log(`[SMS:mock] -> ${phone} : code=${code}`);
  }
}

let _provider: SmsProvider = new MockSmsProvider();

export function getSmsProvider(): SmsProvider {
  return _provider;
}

/** 测试或需要切换真实网关时调用 */
export function setSmsProvider(provider: SmsProvider): void {
  _provider = provider;
}
