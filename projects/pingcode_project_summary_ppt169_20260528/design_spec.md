# pingcode_project_summary - Design Spec

> Human-readable design narrative.

## I. Project Information

| Item | Value |
| ---- | ----- |
| **Project Name** | PingCode系统实施项目总结 |
| **Canvas Format** | PPT 16:9 (1280×720) |
| **Page Count** | 8 |
| **Design Style** | General Consulting + 科技简约风 |
| **Target Audience** | 项目管理团队、金溢科技管理层、项目干系人 |
| **Use Case** | 项目总结汇报会议 |
| **Created Date** | 2026-05-28 |

## II. Canvas Specification

| Property | Value |
| -------- | ----- |
| **Format** | PPT 16:9 |
| **Dimensions** | 1280×720 |
| **viewBox** | `0 0 1280 720` |
| **Margin Left/Right** | 60px |
| **Margin Top/Bottom** | 50px |
| **Content Area** | 1160×620 |

## III. Visual Theme

### Theme Style

- **Style**: General Consulting + 科技简约风
- **Theme**: Light theme
- **Tone**: 专业、现代、可信赖

### Color Scheme

| Role | HEX | Purpose |
| ---- | --- | ------- |
| **Background** | `#F8FAFC` | 页面底色 |
| **Secondary bg** | `#FFFFFF` | 卡片背景 |
| **Primary** | `#2563EB` | 标题装饰、关键区块、主色 |
| **Accent** | `#F59E0B` | 里程碑标记、甘特图高亮 |
| **Secondary accent** | `#7C3AED` | 渐变、辅助强调 |
| **Body text** | `#1E293B` | 正文 |
| **Secondary text** | `#64748B` | 说明、辅助信息 |
| **Tertiary text** | `#94A3B8` | 补充信息 |
| **Border/divider** | `#E2E8F0` | 分割线 |
| **Success** | `#10B981` | 完成 |
| **Warning** | `#EF4444` | 警示/风险 |

## IV. Typography System

### Font Plan

**Typography direction**: modern CJK sans — consistent, clean hierarchy

- **Title**: `"Source Han Sans SC", "Microsoft YaHei", sans-serif`
- **Body**: `"Source Han Sans SC", "Microsoft YaHei", sans-serif`
- **Emphasis**: `"Source Han Sans SC Bold", "Microsoft YaHei", sans-serif`
- **Code**: `Consolas, "Courier New", monospace`
- **Formula rendering policy**: `text-only`

Per-role font stacks:
- Title: `"Source Han Sans SC", "Microsoft YaHei", sans-serif`
- Body: `"Source Han Sans SC", "Microsoft YaHei", sans-serif`
- Data: `Consolas, "Courier New", monospace`

Font size ramp (anchor: body = 18px):
- Cover title: 48px
- Title: 32px
- Subtitle: 24px
- Body: 18px
- Body small: 16px
- Annotation: 14px
- Chart label: 13px
- Hero number: 56px

## V. Layout Strategy

Free design. Each content page uses a consistent header bar + content area structure.

**Page structure**:
- Top: thin accent bar (primary color) + page number + section title
- Content area: flexible — card grids, tables, timelines, charts
- Bottom: thin separator line
- Cover: full custom design
- Ending: centered thank-you

## VI. Icon Strategy

- **Library**: chunk-filled
- **Inventory**: target, bolt, shield, users, chart-bar, lightbulb, cog, check, clock, clipboard, server, book, flag

## VII. Visualization Strategy

| Page | Visualization | Reference |
|------|--------------|-----------|
| P03 | 甘特图 — 项目主计划时间线 | `templates/charts/gantt_chart.svg` |
| P04-P06 | 卡片布局 — 阶段详情 | Free design |
| P07 | KPI 卡片 — 项目成果指标 | `templates/charts/kpi_cards.svg` |

## VIII. Image Resource List

No external images. All visuals are SVG-native.

## IX. Content Outline

### P01 — 封面
- **Rhythm**: anchor
- **Layout**: free design
- **Content**: 项目名称 "PingCode系统实施"、副标题 "项目总结汇报"、日期 "2026年6月"、组织 "金溢科技"
- **Design**: 大面积蓝色背景或渐变，白色标题居中

### P02 — 项目概述
- **Rhythm**: breathing
- **Layout**: free design
- **Content**: 项目背景（为什么需要PingCode）、项目目标（部署上线全覆盖）、项目范围（5阶段/19任务/6里程碑）、项目周期（2026.05-2026.12）
- **Design**: 左侧简介文字 + 右侧关键数字卡片

### P03 — 主计划甘特图 🎯
- **Rhythm**: dense
- **Layout**: free design + gantt_chart adaptation
- **Chart**: gantt_chart
- **Content**: 
  - 阶段1: 项目准备与系统部署 (05/21 - 06/12)
  - 阶段2: 系统试点 (06/15 - 06/26)
  - 阶段3: 系统上线 (06/22 - 06/29)
  - 阶段4: 上线通知 (06/30)
  - 阶段5: 跟踪验收 (06/30 - 12/31)
  - 里程碑标注: 项目启动会(05/29)、系统初始配置完成(06/12)、试运行完成(06/26)、培训完成(06/29)、正式上线(06/30)、验收通过(12/31)
- **Design**: 横轴时间 5月→12月，纵轴阶段和任务

### P04 — 阶段1详述：项目准备与系统部署
- **Rhythm**: dense
- **Layout**: free design — card grid
- **Content**: 9个关键任务卡片（合同签订→团队组建→业务梳理→系统部署→需求调研→启动会→方案输出→权限收集→初始配置），里程碑标注
- **Design**: 流程式卡片排列，按时间从左到右

### P05 — 阶段2~4详述：试点·上线·通知
- **Rhythm**: dense
- **Layout**: free design — 3-column section
- **Content**: 
  - 系统试点 (6/15-6/26): 培训、手册、试运行、优化
  - 系统上线 (6/22-6/29): 优化手册、管理员培训、操作培训
  - 上线通知 (6/30): 业务通知、正式切换
- **Design**: 三栏布局，每栏一个阶段摘要

### P06 — 阶段5详述：跟踪验收
- **Rhythm**: breathing
- **Layout**: free design
- **Content**: 
  - 系统使用问题收集与持续优化（06/30起）
  - 项目交付验收（待定）
  - 关键角色：需求发起人、IT、系统管理员
- **Design**: 简洁两栏：左侧问题跟踪流程，右侧验收清单

### P07 — 项目成果与关键指标
- **Rhythm**: dense
- **Layout**: free design + kpi_cards
- **Chart**: kpi_cards
- **Content**:
  - 19个任务全部创建
  - 5个阶段6个里程碑
  - 项目周期约7个月
  - 0延期风险（按计划推进）
  - 交付物：系统方案、权限表、用户手册、使用规范、培训记录
- **Design**: KPI 卡片 + 交付物清单

### P08 — 致谢
- **Rhythm**: anchor
- **Layout**: free design
- **Content**: "谢谢" / "Thank You"、项目团队、联系方式
- **Design**: 简约居中，蓝色渐变背景

## X. Speaker Notes

Not required for this deck.

## XI. Technical Constraints

- No AI-generated images
- No external font loading
- All charts SVG-native
- Gantt chart on P03 adapted from `templates/charts/gantt_chart.svg`
