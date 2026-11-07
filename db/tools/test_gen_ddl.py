#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_ddl.py 자체 시험 (표준 라이브러리 unittest).

실행 (저장소 맨 위에서)
    python3 -I db/tools/test_gen_ddl.py

저장소 안의 사본(db/ddl/_source_columns.csv · _source_entities.csv)으로 다시 만들어 본다.
"""

import importlib.util
import re
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
DDL_DIR = HERE.parent / "ddl"

_spec = importlib.util.spec_from_file_location("gen_ddl", HERE / "gen_ddl.py")
gen_ddl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gen_ddl)

COLS = DDL_DIR / gen_ddl.COPY_COLUMNS_NAME
ENTS = DDL_DIR / gen_ddl.COPY_ENTITIES_NAME


class GenDdlTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.files, cls.info = gen_ddl.build(COLS, ENTS)

    def test_all_tables_generated(self):
        for t in gen_ddl.TABLES:
            self.assertIn(f"{t}.sql", self.files)

    def test_scr_menu_exact_columns_and_pk(self):
        s = self.files["TB_SCR_MENU.sql"]
        body = re.search(r"CREATE TABLE TB_SCR_MENU \((.*?)\n\);", s, re.S).group(1)
        lines = [l.strip().rstrip(",") for l in body.splitlines() if l.strip()]
        expected = [
            "MENU_ID VARCHAR2(10) NOT NULL",
            "PARENT_MENU_ID VARCHAR2(10) NOT NULL",
            "MENU_NM VARCHAR2(100) NOT NULL",
            "MENU_TYPE CHAR(1) NOT NULL",
            "MENU_PATH VARCHAR2(300)",
            "SORT_NO NUMBER(5) NOT NULL",
            "USE_YN CHAR(1) NOT NULL",
            "CRT_DTM CHAR(14)",
            "CRT_CMENO VARCHAR2(9)",
            "LSCHG_DTM CHAR(14)",
            "LS_CMENO VARCHAR2(9)",
            "CONSTRAINT PK_TB_SCR_MENU PRIMARY KEY (MENU_ID)",
        ]
        self.assertEqual([" ".join(l.split()) for l in lines], expected)
        self.assertIn("SET DEFINE OFF", s)
        self.assertIn("COMMENT ON TABLE TB_SCR_MENU IS '업무시스템메뉴 - 업무시스템 메뉴를 관리한다';", s)
        self.assertIn("COMMENT ON COLUMN TB_SCR_MENU.MENU_TYPE IS '메뉴타입(G:그룹, M:화면) - 메뉴타입을 관리한다.';", s)
        self.assertEqual(s.count("COMMENT ON COLUMN TB_SCR_MENU."), 11)
        self.assertNotIn("FOREIGN KEY", s)
        self.assertNotIn("REFERENCES", s)

    def test_composite_pk_order(self):
        self.assertIn("CONSTRAINT PK_TB_CO_MODEL PRIMARY KEY (VEND_CODE, MCN_TYPE, MODEL_CODE)",
                      self.files["TB_CO_MODEL.sql"])

    def test_notice_keeps_date_column(self):
        self.assertRegex(self.files["TB_NOTICE.sql"], r"\n    WRT_DATE\s+DATE,\n")

    def test_reading_memo_is_warned(self):
        self.assertIn("판독메모 PER_NO", self.files["TB_INSA.sql"])

    def test_quote_escape(self):
        self.assertEqual(gen_ddl.sql_str("a'b"), "'a''b'")

    def test_matches_committed_files(self):
        """db/ddl 의 파일이 생성 결과와 같다(손으로 고치지 않았다)."""
        for name, text in self.files.items():
            path = DDL_DIR / name
            self.assertTrue(path.is_file(), name)
            self.assertEqual(path.read_bytes(), text.encode("utf-8"), name)

    def test_deterministic_into_temp_dir(self):
        with tempfile.TemporaryDirectory() as d:
            rc1 = gen_ddl.main([str(COLS), "--entities", str(ENTS), "--out", d])
            first = {p.name: p.read_bytes() for p in Path(d).iterdir()}
            rc2 = gen_ddl.main([str(COLS), "--entities", str(ENTS), "--out", d])
            second = {p.name: p.read_bytes() for p in Path(d).iterdir()}
        self.assertEqual((rc1, rc2), (0, 0))
        self.assertEqual(first, second)

    def test_missing_table_is_error(self):
        with tempfile.TemporaryDirectory() as d:
            bad = Path(d) / "cols.csv"
            text = COLS.read_text(encoding="utf-8-sig")
            kept = [l for l in text.splitlines() if ",TB_NOTICE," not in l]
            bad.write_text("\n".join(kept) + "\n", encoding="utf-8-sig")
            with self.assertRaises(gen_ddl.GenError):
                gen_ddl.build(bad, ENTS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
