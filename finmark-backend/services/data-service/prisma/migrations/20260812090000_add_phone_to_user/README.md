# 20260812090000_add_phone_to_user

SMS OTP 登录(PRD 9.2 验收项)需要 `users.phone` 字段,本次新增:
- `phone TEXT`(可空,存量行不破坏)
- 局部唯一索引 `users_phone_key`(只对非空 phone 生效,允许多个 NULL)

## 部署

```sh
# 1. 拿到 PG 实例连接串后
cd finmark-backend
pnpm install
pnpm --filter data-service db:push
# 或者更稳的方式(生成新 migration 文件,再 review 后 deploy)
pnpm --filter data-service db:migrate dev --name add_phone
```

## 校验

```sh
psql "$DATABASE_URL" -c "\d users" | grep phone
# 应输出: phone | text |  |  |
psql "$DATABASE_URL" -c "\di users_phone_key"
# 应输出: users_phone_key | UNIQUE | btree | phone
```

## 兼容性

- 老用户:不填 phone,otp 登录会触发自动建号(operator 角色,username=`phone_<num>`)
- 不回填历史数据的 phone 字段(无法推断)
- 如需回滚:`ALTER TABLE users DROP COLUMN phone;`
