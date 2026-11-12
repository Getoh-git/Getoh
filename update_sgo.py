#!/usr/bin/env python3
"""อัปเดต sgo-data.json (ตารางเที่ยวรถไปชิราคาวาโกะ) แล้วตรวจก่อนเขียนเสมอ

ลำดับงาน:  ดึงไฟล์ต้นทาง -> adapter อ่านเป็นแถวเวลา -> ตรวจรูปแบบ/ความสมเหตุสมผล -> เทียบกับของเดิม -> เขียนไฟล์ + สรุปความต่าง
ถ้าตรวจไม่ผ่านจะ "ไม่เขียนทับ" และจบด้วย exit code ไม่ใช่ 0 (GitHub จะส่งอีเมลแจ้งเจ้าของ repo)

วิธีใช้:
  python scripts/update_sgo.py                         # ดึงจากแหล่งที่ enabled ใน scripts/sources.json
  python scripts/update_sgo.py --pdf nohi=ไฟล์.pdf     # ใช้ PDF ในเครื่องแทนการดาวน์โหลด (ใช้ตอนปรับ adapter)
  python scripts/update_sgo.py --from-json new.json    # นำเข้าข้อมูลที่เตรียมเอง ผ่านการตรวจชุดเดียวกัน
  เพิ่ม --dry-run เพื่อดูความต่างโดยไม่เขียนไฟล์

exit code: 0 สำเร็จ (จะมีหรือไม่มีการเปลี่ยนก็ได้) · 2 ข้อมูลใหม่ตรวจไม่ผ่าน · 3 ดึง/อ่านต้นทางไม่ได้
"""
import argparse, datetime, json, os, pathlib, re, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TRAIN_KEYS = ["tbOut", "tbBack", "hidaOut", "hidaBack"]
BUS_KEYS = ["busKzSg", "busSgKz", "busTkySg", "busSgTky"]
KEYS = TRAIN_KEYS + BUS_KEYS
TIME = re.compile(r"^([01]?\d|2[0-3]):[0-5]\d$")
MONTH_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
MAX_PDF = 20 * 1024 * 1024


class SourceError(Exception):
    """ดึงหรืออ่านต้นทางไม่ได้"""


class AdapterNotCalibrated(SourceError):
    """adapter ยังไม่ได้ปรับให้ตรงกับไฟล์จริง"""


def mins(t):
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def validate(new, old):
    """คืนรายการข้อผิดพลาด (ว่าง = ผ่าน) กติกาเดียวกับ sgValid() ใน plan.js แต่เข้มกว่าเรื่องจำนวนเที่ยว"""
    errs = []
    if not isinstance(new, dict):
        return ["ข้อมูลไม่ใช่ object"]
    for k in KEYS:
        rows = new.get(k)
        if not isinstance(rows, list):
            errs.append(f"{k}: ไม่มีรายการ")
            continue
        n_old = len(old.get(k, []))
        if len(rows) < 3:
            errs.append(f"{k}: เที่ยวน้อยเกินไป ({len(rows)})")
        if n_old and not (0.6 * n_old <= len(rows) <= 1.6 * n_old):
            errs.append(f"{k}: จำนวนเที่ยวเปลี่ยนผิดปกติ {n_old} -> {len(rows)} (ถ้าเป็นเรื่องจริงให้ตรวจเองแล้วใช้ --force)")
        is_train = k in TRAIN_KEYS
        seen = set()
        for r in rows:
            try:
                dep, arr = (r[1], r[2]) if is_train else (r[0], r[1])
                fl = None if is_train else (r[2] if len(r) > 2 else None)
                if is_train and not isinstance(r[0], str):
                    raise ValueError("เลขขบวนต้องเป็นข้อความ")
                if not (TIME.match(dep) and TIME.match(arr)):
                    raise ValueError("รูปแบบเวลาไม่ถูก")
                if mins(arr) <= mins(dep) and not (fl and fl.get("bad")):
                    raise ValueError("เวลาถึงไม่หลังเวลาออก")
                if fl and (not isinstance(fl, dict) or set(fl) - {"w", "d", "bad"}):
                    raise ValueError("ธงไม่รู้จัก")
                key = (r[0], dep) if is_train else (dep, arr)
                if key in seen:
                    raise ValueError("แถวซ้ำ")
                seen.add(key)
            except (IndexError, TypeError, ValueError, AttributeError) as e:
                errs.append(f"{k}: แถว {r!r} ใช้ไม่ได้ ({e})")
    return errs


def diff_lines(old, new):
    out = []
    for k in KEYS:
        a = {json.dumps(r, ensure_ascii=False) for r in old.get(k, [])}
        b = {json.dumps(r, ensure_ascii=False) for r in new.get(k, [])}
        if a == b:
            continue
        out.append(f"### {k}  ({len(a)} -> {len(b)} เที่ยว)")
        out += [f"- ลบ  {x}" for x in sorted(a - b)]
        out += [f"+ เพิ่ม {x}" for x in sorted(b - a)]
        out.append("")
    return out


def download(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "osaka-trip-timetable-check/1.0 (personal trip planner; weekly)"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read(MAX_PDF + 1)
    except Exception as e:
        raise SourceError(f"ดาวน์โหลดไม่ได้: {url} ({e})")
    if len(body) > MAX_PDF:
        raise SourceError("ไฟล์ใหญ่เกินกำหนด")
    if not body.startswith(b"%PDF"):
        raise SourceError("ไฟล์ที่ได้ไม่ใช่ PDF (หน้าเว็บอาจย้าย/เปลี่ยนรูปแบบ)")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(body)
    return dest


# ---------------- adapters ----------------
# adapter รับ path ของ PDF แล้วคืน dict เฉพาะคีย์ที่แหล่งนั้นดูแล เช่น {"busKzSg": [["8:10","9:35"], ...], ...}
# รูปแถวบัส: [ออก, ถึง] หรือ [ออก, ถึง, {"w":1}] (w=หยุด 1 ธ.ค.-31 มี.ค. / d=หยุดเสาร์-อาทิตย์-วันหยุด / bad=ข้อมูลน่าสงสัย)
def adapter_nohi_pdf(pdf_path, cfg):
    """ตัวอ่านตาราง Nohi Bus — ยังไม่ได้ปรับให้ตรงกับไฟล์จริง

    ต้องทำก่อนเปิดใช้: ใส่ PDF จริงที่ต้องการอ่าน แล้วดูผลของ
        import pdfplumber; p = pdfplumber.open(pdf_path); p.pages[0].extract_tables()
    จากนั้นเขียนโค้ดแปลงตารางเป็นแถว [ออก, ถึง, ธง] ของ 4 เส้นทางที่ cfg["updates"] ระบุ
    (คานาซาวะ->ชิราคาวาโกะ, กลับ, ทาคายาม่า->ชิราคาวาโกะ, กลับ) และแปลงสัญลักษณ์ △ ◆ เป็นธง w / d
    """
    raise AdapterNotCalibrated("adapter nohi_pdf ยังไม่ได้ปรับให้ตรงกับ PDF จริง")


ADAPTERS = {"nohi_pdf": adapter_nohi_pdf}


def collect(args):
    """รวมข้อมูลใหม่ (partial) จากทุกแหล่งที่เปิดใช้ หรือจากไฟล์ที่ระบุ"""
    if args.from_json:
        j = json.loads(pathlib.Path(args.from_json).read_text(encoding="utf-8"))
        return j.get("data", j), [], []
    cfg = json.loads((ROOT / "scripts" / "sources.json").read_text(encoding="utf-8"))
    partial, links, used = {}, [], []
    overrides = dict(p.split("=", 1) for p in (args.pdf or []))
    for s in cfg["sources"]:
        if not s.get("enabled") and s["id"].split("-")[0] not in overrides:
            print(f"ข้าม {s['id']} (enabled=false)")
            continue
        pdf = overrides.get(s["id"].split("-")[0])
        pdf = pathlib.Path(pdf) if pdf else download(s["url"], ROOT / "scripts" / "cache" / (s["id"] + ".pdf"))
        got = ADAPTERS[s["adapter"]](pdf, s)
        extra = set(got) - set(s["updates"])
        if extra:
            raise SourceError(f"{s['id']} คืนคีย์นอกขอบเขต: {sorted(extra)}")
        partial.update(got)
        links.append({"t": s.get("link_title", s["id"]), "u": s["url"]})
        used.append(s["id"])
    return partial, links, used


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--data", default=str(ROOT / "sgo-data.json"))
    ap.add_argument("--from-json")
    ap.add_argument("--pdf", action="append", help="id=path เช่น nohi=timetable.pdf")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="ข้ามการเตือนเรื่องจำนวนเที่ยวเปลี่ยนมาก (รูปแบบเวลาที่ผิดยังไม่ผ่านอยู่ดี)")
    args = ap.parse_args()

    data_path = pathlib.Path(args.data)
    cur = json.loads(data_path.read_text(encoding="utf-8"))
    old = cur["data"]

    try:
        partial, links, used = collect(args)
    except SourceError as e:
        print("::error::" + str(e) if os.getenv("GITHUB_ACTIONS") else "ผิดพลาด: " + str(e))
        return 3
    if not partial:
        print("ไม่มีแหล่งข้อมูลที่เปิดใช้ ไม่มีอะไรต้องทำ")
        set_output(False)
        return 0

    new = {**old, **partial}
    errs = validate(new, old)
    if args.force:
        errs = [e for e in errs if "จำนวนเที่ยวเปลี่ยนผิดปกติ" not in e]
    if errs:
        print("ข้อมูลใหม่ตรวจไม่ผ่าน ไม่เขียนทับ:")
        print("\n".join("  - " + e for e in errs))
        return 2

    d = diff_lines(old, new)
    if not d:
        print("ตารางไม่เปลี่ยน")
        set_output(False)
        return 0

    print("\n".join(d))
    if args.dry_run:
        print("(dry-run: ไม่ได้เขียนไฟล์)")
        return 0

    today = datetime.date.today()
    meta = dict(cur.get("meta", {}))
    meta.update({
        "label": f"{today.day} {MONTH_TH[today.month - 1]} {today.year}",
        "updated": today.isoformat(),
        "note": "อัปเดตโดย scripts/update_sgo.py จาก: " + (", ".join(used) or args.from_json or "-") + " (รถไฟยังเป็นข้อมูลเดิม)",
    })
    if links:
        meta["links"] = links
    data_path.write_text(json.dumps({"meta": meta, "data": new}, ensure_ascii=False, indent=1), encoding="utf-8")
    (ROOT / "scripts" / "last_diff.md").write_text(
        "ตารางเที่ยวรถเปลี่ยน — **ตรวจเทียบกับตารางทางการก่อน merge**\n\n" + "\n".join(d), encoding="utf-8")
    set_output(True)
    return 0


def set_output(changed):
    f = os.getenv("GITHUB_OUTPUT")
    if f:
        with open(f, "a", encoding="utf-8") as fh:
            fh.write(f"changed={'true' if changed else 'false'}\n")


if __name__ == "__main__":
    sys.exit(main())
