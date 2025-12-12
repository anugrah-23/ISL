# normalize_required_csv.py
# Converts Python-list-like filenames fields to semicolon-separated plain strings
import csv, ast, os
IN = "video-pipeline/required_words_mapping.csv"
OUT = "video-pipeline/required_words_mapping_normalized.csv"
with open(IN, newline='', encoding='utf8') as fin, open(OUT, "w", newline='', encoding='utf8') as fout:
    rdr = csv.DictReader(fin)
    fieldnames = rdr.fieldnames
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()
    for row in rdr:
        fn_field = row.get("filenames","")
        try:
            parsed = ast.literal_eval(fn_field) if fn_field else []
            row["filenames"] = ";".join(parsed)
        except Exception:
            row["filenames"] = fn_field
        writer.writerow(row)
print("Wrote", OUT)
