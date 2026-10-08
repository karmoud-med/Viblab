with open('extracted_equipement_5/formation-qcm/calc.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

pos = text.find('isoChart')
end_pos = text.find('function convAll', pos)
if end_pos == -1:
    end_pos = pos + 6000

iso_code = text[max(0, pos-500):end_pos]

with open('dumped_iso_calc.js', 'w', encoding='utf-8') as out:
    out.write(iso_code)

print(f"Wrote {len(iso_code)} chars to dumped_iso_calc.js")
