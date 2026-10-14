# Cập nhật cấu hình Claude (13/10/2026)

Bản cũ đã được sao lưu tại `.claude/backup-20261013/`.

Chạy tại thư mục gốc project để áp dụng:

```sh
cp -R claude-config-update/rules/. .claude/rules/ \
 && cp -R claude-config-update/skills/. .claude/skills/ \
 && cp claude-config-update/CLAUDE.md CLAUDE.md \
 && rm -rf claude-config-update
```
