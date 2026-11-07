#!/usr/bin/env bash
# =====================================================================
# 반입용 파일별 SHA-512 목록 만들기 (docs/00_설계.md §10, docs/01_실행_배포.md §5)
#
# 쓰는 법 (저장소 맨 위에서)
#   bash tools/sha512-list.sh
#   → SHA512SUMS.txt  (git ls-files 에 있는 파일마다 한 줄: "<해시>  <경로>")
#
# 받은 쪽 확인 (같은 폴더 구조의 맨 위에서)
#   sha512sum -c SHA512SUMS.txt
#
# 알아 둘 것
#   - 목록은 Git 이 관리하는 파일(git ls-files)만이다. 아직 git add 하지 않은 새 파일은 빠진다
#     → 실행하면 "Git 에 안 들어간 파일" 수를 알려 준다. 0 이 아니면 먼저 커밋하고 다시 돌린다.
#   - 해시는 지금 디스크에 있는 파일 내용으로 만든다. 반입할 바로 그 폴더(복사본)에서 돌린다.
#     (Windows 에서 core.autocrlf 로 줄끝이 바뀐 사본이면 다른 PC 의 해시와 다를 수 있다)
#   - SHA512SUMS.txt 자신은 목록에 넣지 않는다.
#
# Windows: Git for Windows 의 Git Bash 에서 그대로 돌린다(sha512sum·xargs 가 함께 들어 있다).
#   cmd/PowerShell 에서는 안 된다 → 시작 메뉴 "Git Bash" 를 열고 저장소 폴더로 cd 한 뒤 실행.
# =====================================================================
set -euo pipefail

OUT="SHA512SUMS.txt"

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$root" ]; then
  echo "Git 저장소 안에서 실행하세요 (git rev-parse 실패)." >&2
  exit 1
fi
if [ "$(cd "$root" && pwd -P)" != "$(pwd -P)" ]; then
  echo "저장소 맨 위에서 실행하세요: cd \"$root\"" >&2
  exit 1
fi
command -v sha512sum >/dev/null 2>&1 || { echo "sha512sum 이 없습니다 (Windows 는 Git Bash 에서)." >&2; exit 1; }

untracked="$(git ls-files --others --exclude-standard | grep -vc "^${OUT}\$" || true)"
changed="$(git status --porcelain --untracked-files=no | grep -vc " ${OUT}\$" || true)"

git ls-files -z -- . ":(exclude)${OUT}" | xargs -0 sha512sum > "$OUT"

count="$(wc -l < "$OUT" | tr -d ' ')"
echo "만듦: ${OUT} (파일 ${count}개)"
if [ "$untracked" != "0" ]; then
  echo "주의: Git 에 안 들어간 파일 ${untracked}개는 목록에 없습니다 (git status 로 확인)." >&2
fi
if [ "$changed" != "0" ]; then
  echo "주의: 커밋하지 않은 변경 파일 ${changed}개 — 해시는 지금 디스크 내용 기준입니다." >&2
fi
