#!/bin/bash

# P0+P1 功能测试脚本
# 使用方法：./test-p0-p1.sh YOUR_JWT_TOKEN

TOKEN=$1
BASE_URL="http://localhost:3001/api"

if [ -z "$TOKEN" ]; then
    echo "❌ 请提供 JWT Token"
    echo "用法：./test-p0-p1.sh YOUR_JWT_TOKEN"
    exit 1
fi

echo "🚀 开始测试 P0+P1 功能"
echo "Base URL: $BASE_URL"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "测试：$name ... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | awk 'NR>1' | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✅ 通过${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}❌ 失败${NC} (期望 HTTP $expected_status, 实际 HTTP $http_code)"
        echo "响应：$body"
        return 1
    fi
}

# 计数器
PASSED=0
FAILED=0

echo "======================================"
echo "P0 - 告警系统测试"
echo "======================================"

# 1. 创建告警规则
test_api "创建告警规则" "POST" "/alarms/rules" \
    '{"name":"触达率过低","metric":"reach_rate","condition":"lt","threshold":50,"level":"warning","channels":["app_push","sms"]}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    ALARM_ID=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$ALARM_ID" ]; then
        echo "  告警 ID: $ALARM_ID"
    fi
else
    ((FAILED++))
fi

# 2. 获取所有告警规则
test_api "获取告警列表" "GET" "/alarms/rules" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

# 3. 获取单个告警
if [ ! -z "$ALARM_ID" ]; then
    test_api "获取单个告警" "GET" "/alarms/rules/$ALARM_ID" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 4. 更新告警规则
if [ ! -z "$ALARM_ID" ]; then
    test_api "更新告警规则" "PUT" "/alarms/rules/$ALARM_ID" \
        '{"threshold":60}' "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 5. 手动触发评估
if [ ! -z "$ALARM_ID" ]; then
    test_api "触发告警评估" "POST" "/alarms/evaluate" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 6. 获取告警历史
test_api "获取告警历史" "GET" "/alarms/history" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

# 7. 删除告警规则
if [ ! -z "$ALARM_ID" ]; then
    test_api "删除告警规则" "DELETE" "/alarms/rules/$ALARM_ID" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

echo ""
echo "======================================"
echo "P0 - 报表系统测试"
echo "======================================"

# 1. 生成 PDF 报表
test_api "生成 PDF 报表" "POST" "/reports/generate" \
    '{"name":"3 月营销汇总","type":"summary","format":"pdf","dateRange":{"start":"2026-03-01T00:00:00Z","end":"2026-03-31T23:59:59Z"}}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    REPORT_ID=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$REPORT_ID" ]; then
        echo "  报表 ID: $REPORT_ID"
        sleep 3 # 等待生成
    fi
else
    ((FAILED++))
fi

# 2. 获取报表详情
if [ ! -z "$REPORT_ID" ]; then
    test_api "获取报表详情" "GET" "/reports/$REPORT_ID" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 3. 下载报表
if [ ! -z "$REPORT_ID" ]; then
    echo -n "测试：下载 PDF 报表 ... "
    curl -s -o "/tmp/report_$REPORT_ID.pdf" -X GET "$BASE_URL/reports/$REPORT_ID/download" \
        -H "Authorization: Bearer $TOKEN"
    if [ -f "/tmp/report_$REPORT_ID.pdf" ] && [ -s "/tmp/report_$REPORT_ID.pdf" ]; then
        echo -e "${GREEN}✅ 通过${NC} (文件大小：$(ls -lh /tmp/report_$REPORT_ID.pdf | awk '{print $5}'))"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC} (文件不存在或为空)"
        ((FAILED++))
    fi
fi

# 4. 生成 Excel 报表
test_api "生成 Excel 报表" "POST" "/reports/generate" \
    '{"name":"3 月详细数据","type":"scenario","format":"excel","dateRange":{"start":"2026-03-01T00:00:00Z","end":"2026-03-31T23:59:59Z"}}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    REPORT_ID2=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$REPORT_ID2" ]; then
        echo "  报表 ID: $REPORT_ID2"
        sleep 3
    fi
else
    ((FAILED++))
fi

# 5. 下载 Excel 报表
if [ ! -z "$REPORT_ID2" ]; then
    echo -n "测试：下载 Excel 报表 ... "
    curl -s -o "/tmp/report_$REPORT_ID2.xlsx" -X GET "$BASE_URL/reports/$REPORT_ID2/download" \
        -H "Authorization: Bearer $TOKEN"
    if [ -f "/tmp/report_$REPORT_ID2.xlsx" ] && [ -s "/tmp/report_$REPORT_ID2.xlsx" ]; then
        echo -e "${GREEN}✅ 通过${NC} (文件大小：$(ls -lh /tmp/report_$REPORT_ID2.xlsx | awk '{print $5}'))"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC} (文件不存在或为空)"
        ((FAILED++))
    fi
fi

echo ""
echo "======================================"
echo "P1 - 工作流系统测试"
echo "======================================"

# 1. 创建工作流
test_api "创建工作流" "POST" "/expert/workflows" \
    '{"name":"客户入职流程","description":"新客户欢迎流程","nodes":[],"edges":[]}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    WORKFLOW_ID=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$WORKFLOW_ID" ]; then
        echo "  工作流 ID: $WORKFLOW_ID"
    fi
else
    ((FAILED++))
fi

# 2. 获取所有工作流
test_api "获取工作流列表" "GET" "/expert/workflows" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

# 3. 更新工作流
if [ ! -z "$WORKFLOW_ID" ]; then
    test_api "更新工作流" "PUT" "/expert/workflows/$WORKFLOW_ID" \
        '{"enabled":true,"status":"active"}' "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 4. 执行工作流
if [ ! -z "$WORKFLOW_ID" ]; then
    test_api "执行工作流" "POST" "/expert/workflows/$WORKFLOW_ID/execute" "" "201"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 5. 获取执行历史
test_api "获取执行历史" "GET" "/expert/workflows/executions/history" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

echo ""
echo "======================================"
echo "P1 - 模板系统测试"
echo "======================================"

# 1. 创建模板
test_api "创建模板" "POST" "/expert/templates" \
    '{"name":"欢迎短信","type":"sms","content":"尊敬的{customerName}，欢迎您！","variables":["customerName"],"category":"客户欢迎"}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    TEMPLATE_ID=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$TEMPLATE_ID" ]; then
        echo "  模板 ID: $TEMPLATE_ID"
    fi
else
    ((FAILED++))
fi

# 2. 获取所有模板
test_api "获取模板列表" "GET" "/expert/templates" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

# 3. 渲染模板
if [ ! -z "$TEMPLATE_ID" ]; then
    test_api "渲染模板" "POST" "/expert/templates/$TEMPLATE_ID/render" \
        '{"variables":{"customerName":"张三"}}' "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 4. 复制模板
if [ ! -z "$TEMPLATE_ID" ]; then
    test_api "复制模板" "POST" "/expert/templates/$TEMPLATE_ID/duplicate" \
        '{"newName":"欢迎短信 - 副本"}' "201"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

echo ""
echo "======================================"
echo "P1 - 批量策略测试"
echo "======================================"

# 1. 创建批量操作
test_api "创建批量操作" "POST" "/expert/batch" \
    '{"name":"批量启用场景","operations":[{"type":"scenario","action":"enable"}],"targetIds":[]}' \
    "201"
if [ $? -eq 0 ]; then
    ((PASSED++))
    BATCH_ID=$(echo $body | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"$//')
    if [ ! -z "$BATCH_ID" ]; then
        echo "  批量 ID: $BATCH_ID"
    fi
else
    ((FAILED++))
fi

# 2. 获取所有批量操作
test_api "获取批量列表" "GET" "/expert/batch" "" "200"
if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi

# 3. 执行批量操作
if [ ! -z "$BATCH_ID" ]; then
    test_api "执行批量操作" "POST" "/expert/batch/$BATCH_ID/execute" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

# 4. 获取批量状态
if [ ! -z "$BATCH_ID" ]; then
    test_api "获取批量状态" "GET" "/expert/batch/$BATCH_ID" "" "200"
    if [ $? -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
fi

echo ""
echo "======================================"
echo "测试结果汇总"
echo "======================================"
echo -e "通过：${GREEN}$PASSED${NC}"
echo -e "失败：${RED}$FAILED${NC}"
echo "总计：$((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  有 $FAILED 个测试失败，请检查日志${NC}"
    exit 1
fi
