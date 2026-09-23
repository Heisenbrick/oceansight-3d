with open(r'C:\Users\ayush\.gemini\antigravity\scratch\oceansight-3d-mvp\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

s_start = html.find('<script type="module">')
s_end = html.rfind('</script>')
js = html[s_start + len('<script type="module">'):s_end]
print("JS length:", len(js))
with open(r'C:\Users\ayush\.gemini\antigravity\scratch\oceansight-3d-mvp\pipeline\test_script.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Saved test_script.js")
