#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TO-BE 정본 CSV(20_TOBE컬럼정의서.csv · 20_TOBE엔터티목록.csv)에서 이 저장소가 쓰는 TB_ 테이블의
참고용 DDL 을 만든다. 표준 라이브러리만 쓴다(폐쇄망).

실행 (저장소 맨 위에서)
    python3 -I db/tools/gen_ddl.py                 # 원본 CSV 를 자동으로 찾는다(아래 순서)
    python3 -I db/tools/gen_ddl.py <컬럼정의서.csv>  # 원본 CSV 를 직접 지정
    python3 -I db/tools/gen_ddl.py --check          # 파일을 쓰지 않고, 지금 db/ddl 이 생성 결과와 같은지만 확인

원본 CSV 를 찾는 순서 (인자가 없을 때)
    1) db/ddl/_source_columns.csv          — 이 저장소에 들어 있는 사본(필요한 테이블 행만)
    2) ../nh-atms/Document/2.개발문서/20_TOBE컬럼정의서.csv — 저장소 옆에 nh-atms 를 받아 둔 경우(정본 전체)
  정본이 바뀌면 2) 를 인자로 주고 다시 돌린다 → 사본(_source_*.csv)과 DDL 이 함께 갱신된다.

엔터티목록 CSV 는 --entities 로 줄 수 있고, 없으면 컬럼 CSV 와 같은 폴더에서
  _source_columns.csv → _source_entities.csv, 그 밖 → 20_TOBE엔터티목록.csv 를 쓴다.

출력 (기본 db/ddl)
    <TABLE>.sql            테이블마다 1개 (CREATE TABLE + PK + COMMENT, FK 없음)
    _source_columns.csv    쓴 테이블의 컬럼 행만 뽑은 사본 (헤더 동일, UTF-8 BOM, LF)
    _source_entities.csv   쓴 테이블의 엔터티 행만 뽑은 사본

같은 입력이면 몇 번을 돌려도 바이트까지 같은 파일이 나온다(날짜·실행 경로를 파일에 넣지 않는다).
"""

import argparse
import csv
import io
import re
import sys
from pathlib import Path

# 이 저장소가 쓰는 테이블 (설계 §7.1). 출력 순서도 이 순서.
TABLES = (
    "TB_NOTICE",
    "TB_MCN_INFO",
    "TB_CO_MODEL",
    "TB_CO_CODE_MST",
    "TB_CO_CODE",
    "TB_SCR_MENU",
    "TB_SCR_AUTH",
    "TB_SCR_AUTH_MENU",
    "TB_INSA",
    "TB_OFC_REG_MGT",
    "TB_SCRT_INST_PST",
    "TB_NMS_SRC",
    "TB_CO_SIDO",
    "TB_CO_SIGUN",
    "TB_NMS_HDAY",
)

COLUMN_HEADER = ["순번", "주제영역", "엔터티명", "테이블ID", "컬럼순서", "속성명", "컬럼명", "도메인명",
                 "데이터타입", "PK", "FK", "NULL", "설명", "원본페이지", "판독메모"]
ENTITY_HEADER = ["순번", "그룹명", "관리업무명", "서브업무명", "상세업무명", "주제영역", "엔터티명", "테이블ID",
                 "정의", "생성/업무규칙", "NH테크부서", "비고", "원본페이지"]

CANON_COLUMNS_NAME = "20_TOBE컬럼정의서.csv"
CANON_ENTITIES_NAME = "20_TOBE엔터티목록.csv"
COPY_COLUMNS_NAME = "_source_columns.csv"
COPY_ENTITIES_NAME = "_source_entities.csv"

DATATYPE_RE = re.compile(r"^(CHAR|VARCHAR2|NUMBER|DATE|BLOB)(\(\d+(,\d+)?\))?$")
NAME_RE = re.compile(r"^[A-Z][A-Z0-9_]*$")

# Oracle SQL 예약어(Oracle Database SQL Language Reference 'Oracle SQL Reserved Words').
# 정본 이름은 바꾸지 않으므로, 걸리면 머리말에 경고만 남긴다.
ORACLE_RESERVED = frozenset("""
ACCESS ADD ALL ALTER AND ANY AS ASC AUDIT BETWEEN BY CHAR CHECK CLUSTER COLUMN COMMENT COMPRESS
CONNECT CREATE CURRENT DATE DECIMAL DEFAULT DELETE DESC DISTINCT DROP ELSE EXCLUSIVE EXISTS FILE
FLOAT FOR FROM GRANT GROUP HAVING IDENTIFIED IMMEDIATE IN INCREMENT INDEX INITIAL INSERT INTEGER
INTERSECT INTO IS LEVEL LIKE LOCK LONG MAXEXTENTS MINUS MLSLABEL MODE MODIFY NOAUDIT NOCOMPRESS
NOT NOWAIT NULL NUMBER OF OFFLINE ON ONLINE OPTION OR ORDER PCTFREE PRIOR PUBLIC RAW RENAME
RESOURCE REVOKE ROW ROWID ROWNUM ROWS SELECT SESSION SET SHARE SIZE SMALLINT START SUCCESSFUL
SYNONYM SYSDATE TABLE THEN TO TRIGGER UID UNION UNIQUE UPDATE USER VALIDATE VALUES VARCHAR
VARCHAR2 VIEW WHENEVER WHERE WITH
""".split())


class GenError(Exception):
    pass


def repo_root() -> Path:
    # db/tools/gen_ddl.py → 저장소 맨 위
    return Path(__file__).resolve().parents[2]


def default_columns_csv(out_dir: Path) -> Path:
    copy = out_dir / COPY_COLUMNS_NAME
    if copy.is_file():
        return copy
    sibling = repo_root().parent / "nh-atms" / "Document" / "2.개발문서" / CANON_COLUMNS_NAME
    if sibling.is_file():
        return sibling
    raise GenError(
        "원본 CSV 를 찾지 못했습니다. 인자로 20_TOBE컬럼정의서.csv 경로를 주세요.\n"
        f"  찾아본 곳: {copy}\n             {sibling}")


def default_entities_csv(columns_csv: Path) -> Path:
    if columns_csv.name == COPY_COLUMNS_NAME:
        return columns_csv.with_name(COPY_ENTITIES_NAME)
    return columns_csv.with_name(CANON_ENTITIES_NAME)


def read_csv(path: Path, expected_header):
    with open(path, encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        try:
            header = next(reader)
        except StopIteration:
            raise GenError(f"빈 CSV: {path}")
        if header != expected_header:
            raise GenError(f"CSV 헤더가 예상과 다릅니다: {path}\n  실제: {header}\n  예상: {expected_header}")
        rows = []
        for lineno, rec in enumerate(reader, start=2):
            if not any(v.strip() for v in rec):
                continue
            if len(rec) != len(header):
                raise GenError(f"{path}:{lineno} 열 개수 {len(rec)} ≠ {len(header)}")
            rows.append(dict(zip(header, rec)))
    return rows


def write_csv_text(header, rows) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    w.writerow(header)
    for r in rows:
        w.writerow([r[h] for h in header])
    return "﻿" + buf.getvalue()


def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def collect(columns, entities):
    """테이블별 컬럼 목록·엔터티 정보를 검사하며 모은다."""
    result = {}
    for t in TABLES:
        cols = [r for r in columns if r["테이블ID"].strip() == t]
        if not cols:
            raise GenError(f"컬럼정의서에 {t} 가 없습니다.")
        try:
            cols.sort(key=lambda r: int(r["컬럼순서"]))
        except ValueError:
            raise GenError(f"{t}: 컬럼순서가 숫자가 아닙니다.")
        orders = [int(r["컬럼순서"]) for r in cols]
        if orders != list(range(1, len(cols) + 1)):
            raise GenError(f"{t}: 컬럼순서가 1..{len(cols)} 연속이 아닙니다: {orders}")
        names = [r["컬럼명"].strip() for r in cols]
        if len(set(names)) != len(names):
            raise GenError(f"{t}: 같은 컬럼명이 두 번 나옵니다.")
        for r in cols:
            n, dt = r["컬럼명"].strip(), r["데이터타입"].strip()
            if not NAME_RE.match(n):
                raise GenError(f"{t}.{n}: 컬럼명 형식이 이상합니다.")
            if not DATATYPE_RE.match(dt):
                raise GenError(f"{t}.{n}: 지원하지 않는 데이터타입 {dt!r}")
            if r["PK"].strip() not in ("Y", "N"):
                raise GenError(f"{t}.{n}: PK 값 {r['PK']!r}")
            if r["NULL"].strip() not in ("NULL", "NOT NULL"):
                raise GenError(f"{t}.{n}: NULL 값 {r['NULL']!r}")
        ent_names = sorted({r["엔터티명"].strip() for r in cols})

        ents = [e for e in entities if e["테이블ID"].strip() == t]
        if not ents:
            raise GenError(f"엔터티목록에 {t} 가 없습니다.")
        # 엔터티목록에는 같은 테이블ID 가 두 번 나오는 경우가 있다(TB_JL_JNAL 등) → 순번이 가장 작은 행을 쓰고 나머지는 경고.
        ents_sorted = sorted(ents, key=lambda e: (int(e["순번"]) if e["순번"].strip().isdigit() else 10 ** 9, e["순번"]))
        result[t] = {"cols": cols, "entity": ents_sorted[0], "dup_entities": ents_sorted[1:],
                     "col_entity_names": ent_names}
    return result


def render_table(t, info) -> str:
    cols = info["cols"]
    ent = info["entity"]
    pk_cols = [r["컬럼명"].strip() for r in cols if r["PK"].strip() == "Y"]

    warnings = []
    for r in cols:
        memo = r["판독메모"].strip()
        if memo:
            warnings.append(f"판독메모 {r['컬럼명'].strip()}: {memo}")
    for r in cols:
        if r["PK"].strip() == "Y" and r["NULL"].strip() != "NOT NULL":
            warnings.append(f"PK 컬럼 {r['컬럼명'].strip()} 가 정본에서 NULL 허용 — Oracle PK 는 NOT NULL 로 만든다")
    for r in cols:
        if r["컬럼명"].strip() in ORACLE_RESERVED:
            warnings.append(f"Oracle 예약어 컬럼 {r['컬럼명'].strip()} — 따옴표 없이는 DDL 이 실패할 수 있음")
    if info["col_entity_names"] != [ent["엔터티명"].strip()]:
        warnings.append(f"엔터티명 불일치: 컬럼정의서 {info['col_entity_names']} / 엔터티목록 {ent['엔터티명'].strip()!r}")
    for d in info["dup_entities"]:
        warnings.append(f"엔터티목록 중복 행(순번 {d['순번'].strip()}) — 순번 {ent['순번'].strip()} 행을 씀")

    seqs = [int(r["순번"]) for r in cols if r["순번"].strip().isdigit()]
    pages = sorted({r["원본페이지"].strip() for r in cols if r["원본페이지"].strip()})

    out = []
    a = out.append
    a("-- =====================================================================")
    a(f"-- {t}  {ent['엔터티명'].strip()}")
    a("-- ---------------------------------------------------------------------")
    a("-- 생성물: db/tools/gen_ddl.py 가 만든 파일입니다. 손으로 고치지 마세요.")
    a("--         정본 CSV 를 고친 뒤 python3 -I db/tools/gen_ddl.py 로 다시 만듭니다.")
    a(f"-- 원본  : nh-atms Document/2.개발문서/{CANON_COLUMNS_NAME} (사본 db/ddl/{COPY_COLUMNS_NAME})")
    a(f"--         이 테이블 컬럼 행 {len(cols)}개"
      + (f", 순번 {min(seqs)}~{max(seqs)}" if seqs else "")
      + (f", 원본페이지 {', '.join(pages)}" if pages else ""))
    a(f"--         {CANON_ENTITIES_NAME} 순번 {ent['순번'].strip()}, 원본페이지 {ent['원본페이지'].strip()}")
    a(f"-- 주제영역: {ent['주제영역'].strip()} / {ent['상세업무명'].strip()}")
    a(f"-- 정의    : {ent['정의'].strip()}")
    a(f"-- 업무규칙: {ent['생성/업무규칙'].strip()}")
    if ent["비고"].strip():
        a(f"-- 비고    : {ent['비고'].strip()}")
    a(f"-- PK      : {', '.join(pk_cols) if pk_cols else '(없음 — 중복 행을 전제로 다룬다)'}")
    a("-- FK      : 만들지 않는다(원본 FK 전부 N, 21지침 §6)")
    a("-- 주의    : 참고용 DDL 이다. 개발 DB 에 같은 이름 테이블이 이미 있을 수 있으니 db/check 로 먼저 확인(설계 Q10).")
    if warnings:
        a("-- 경고    :")
        for w in warnings:
            a(f"--   * {w}")
    a("-- =====================================================================")
    a("SET DEFINE OFF")
    a("")

    name_w = max(len(r["컬럼명"].strip()) for r in cols)
    type_w = max(len(r["데이터타입"].strip()) for r in cols)
    lines = []
    for r in cols:
        n = r["컬럼명"].strip()
        dt = r["데이터타입"].strip()
        nn = r["NULL"].strip() == "NOT NULL" or r["PK"].strip() == "Y"
        lines.append(f"    {n.ljust(name_w)}  {dt.ljust(type_w)}" + ("  NOT NULL" if nn else ""))
    if pk_cols:
        lines.append(f"    CONSTRAINT PK_{t} PRIMARY KEY ({', '.join(pk_cols)})")
    a(f"CREATE TABLE {t} (")
    a(",\n".join(l.rstrip() for l in lines))
    a(");")
    a("")

    tbl_comment = ent["엔터티명"].strip()
    if ent["정의"].strip():
        tbl_comment += " - " + ent["정의"].strip()
    a(f"COMMENT ON TABLE {t} IS {sql_str(tbl_comment)};")
    for r in cols:
        n = r["컬럼명"].strip()
        attr = r["속성명"].strip()
        desc = r["설명"].strip()
        c = attr if not desc else f"{attr} - {desc}"
        a(f"COMMENT ON COLUMN {t}.{n} IS {sql_str(c)};")
    a("")
    return "\n".join(out)


def build(columns_csv: Path, entities_csv: Path):
    """출력할 파일 {이름: 내용} 을 만든다."""
    columns = read_csv(columns_csv, COLUMN_HEADER)
    entities = read_csv(entities_csv, ENTITY_HEADER)
    info = collect(columns, entities)

    files = {}
    for t in TABLES:
        files[f"{t}.sql"] = render_table(t, info[t])

    want = set(TABLES)
    sub_cols = [r for r in columns if r["테이블ID"].strip() in want]
    sub_ents = [e for e in entities if e["테이블ID"].strip() in want]
    files[COPY_COLUMNS_NAME] = write_csv_text(COLUMN_HEADER, sub_cols)
    files[COPY_ENTITIES_NAME] = write_csv_text(ENTITY_HEADER, sub_ents)
    return files, info


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="TO-BE 정본 CSV → 참고용 DDL (db/ddl)")
    p.add_argument("columns_csv", nargs="?", help="20_TOBE컬럼정의서.csv 또는 db/ddl/_source_columns.csv")
    p.add_argument("--entities", help="20_TOBE엔터티목록.csv 또는 _source_entities.csv")
    p.add_argument("--out", help="출력 폴더 (기본: db/ddl)")
    p.add_argument("--check", action="store_true", help="쓰지 않고 지금 파일과 같은지만 확인(다르면 종료코드 1)")
    args = p.parse_args(argv)

    out_dir = Path(args.out) if args.out else repo_root() / "db" / "ddl"
    try:
        columns_csv = Path(args.columns_csv) if args.columns_csv else default_columns_csv(out_dir)
        entities_csv = Path(args.entities) if args.entities else default_entities_csv(columns_csv)
        for f in (columns_csv, entities_csv):
            if not f.is_file():
                raise GenError(f"파일이 없습니다: {f}")
        files, info = build(columns_csv, entities_csv)
    except GenError as e:
        print(f"[gen_ddl] 오류: {e}", file=sys.stderr)
        return 2

    print(f"[gen_ddl] 컬럼 CSV  : {columns_csv}", file=sys.stderr)
    print(f"[gen_ddl] 엔터티 CSV: {entities_csv}", file=sys.stderr)

    if args.check:
        diff = []
        for name, text in sorted(files.items()):
            path = out_dir / name
            cur = path.read_bytes() if path.is_file() else None
            if cur != text.encode("utf-8"):
                diff.append(name)
        if diff:
            print("[gen_ddl] 생성 결과와 다른 파일: " + ", ".join(diff), file=sys.stderr)
            return 1
        print(f"[gen_ddl] 확인 완료: {len(files)}개 파일이 생성 결과와 같습니다.", file=sys.stderr)
        return 0

    out_dir.mkdir(parents=True, exist_ok=True)
    changed = 0
    for name, text in sorted(files.items()):
        path = out_dir / name
        data = text.encode("utf-8")
        if path.is_file() and path.read_bytes() == data:
            continue
        path.write_bytes(data)
        changed += 1
    for t in TABLES:
        cols = info[t]["cols"]
        pk = [r["컬럼명"].strip() for r in cols if r["PK"].strip() == "Y"]
        print(f"  {t:<18} 컬럼 {len(cols):>3}  PK {','.join(pk) or '-'}")
    print(f"[gen_ddl] {out_dir} : 파일 {len(files)}개 중 {changed}개 바뀜", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
