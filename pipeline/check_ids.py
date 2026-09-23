with open(r'C:\Users\ayush\.gemini\antigravity\scratch\oceansight-3d-mvp\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
ids_used = set(re.findall(r'\$\(["\']([^"\']+)["\']\)', html))
ids_defined = set(re.findall(r'id=["\']([^"\']+)["\']', html))

print("Total IDs used in JS:", len(ids_used))
print("Total IDs defined in HTML:", len(ids_defined))
missing = ids_used - ids_defined
print("Missing IDs:")
for m in sorted(missing):
    print("  ->", m)
