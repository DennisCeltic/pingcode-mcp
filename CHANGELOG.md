# Changelog

## 2026-06-11

### 🚀 新增

- **pingcode__export_pptx** — SVG 转 PPTX 导出工具
  - 输入一组 SVG 页面内容和项目名称，生成可直接用 PowerPoint 打开的 .pptx 文件
  - 支持 16:9 (ppt169) 和 4:3 (ppt43) 两种格式
  - 依赖 ppt-master skill 的 Python 脚本（需 `pip3 install -r skills/ppt-master/requirements.txt`）
  - 可与 AI 生成的 SVG 配合使用，实现端到端 PPT 生成

---

## 2026-05-28

### 🚀 新增

- **pingcode__create_from_wbs** — WBS 分解创建工具
  - 支持瀑布/混合项目按"阶段 → 里程碑 → 任务"层级批量创建工作项
  - 阶段用 `阶段` 类型，带 `start_at`/`end_at` 时间字段
  - 里程碑用 `里程碑` 类型，仅 `end_at`（截止时间），通过 `parent_id` 关联阶段
  - 任务用 `task` 类型，通过 PATCH `phase_id` 关联到所属阶段
  - 同时支持创建时指定 `phase_id`
- **create_project 扩展** — 支持 `waterfall`（瀑布）和 `hybrid`（混合）项目类型
- **create/update_work_item 扩展** — 新增 `phase_id` 字段，用于将任务关联到阶段/里程碑

### 🛠️ PPT Master Skill 集成

- 集成 [PPT Master](https://github.com/hugohe3/ppt-master) AI 驱动 PPTX 生成技能
- 技能入口注册到 `.trae/skills/ppt-master/`
- 完整技能资源位于 `skills/ppt-master/` (git-ignored)
- 自动安装 Python 依赖: `pip3 install -r skills/ppt-master/requirements.txt`

### 🐛 修复

- 修复成员添加 API 格式兼容性问题

---

## 2026-05-27

### 🚀 新增

- **pingcode__add_project_members** — 向项目添加成员工具
- **pingcode__add_product_members** — 向产品添加成员工具
- **pingcode__add_test_library_members** — 向测试库添加成员工具
- **pingcode__add_wiki_members** — 向知识空间添加成员工具

### 🛠️ 改进

- 扩展 `create_work_item` 和 `update_work_item` 支持 `start_at`/`end_at` 字段
- 改进 Wiki 空间创建工具描述

---

## 2026-05-26

### 🚀 初始发布

- MCP Server 框架搭建
- 30个工具覆盖 PingCode Open API
- 企业令牌认证支持
- 项目/工作项/迭代/工时/评论/发布/Wiki/附件/周报等模块覆盖
