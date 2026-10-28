"""Build the single-file Apps Script install bundle without touching READ_KEY values."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tools/leaderboard/Code.gs'
s=p.read_text().split('// BEGIN GENERATED COOPERATION')[0].rstrip()
if "if (d.action === 'coop')" not in s:
 s=s.replace("    if (d.action === 'login')", "    if (d.action === 'coop') return out_(coopHandle_(d));\n    if (d.action === 'login')")
if "p.feature === 'coop'" not in s:
 s=s.replace("  const p = e.parameter || {};", "  const p = e.parameter || {};\n  if (p.feature === 'coop') return out_({ok:true,api:COOP_API,now:Date.now(),date:coopDay()});")
if 'SpreadsheetApp.flush(); } finally { lock' not in s:  # 다시 실행해도 두 번 감싸지 않게
 s=s.replace('} finally { lock.releaseLock(); }','} finally { try { SpreadsheetApp.flush(); } finally { lock.releaseLock(); } }')
core=(root/'data/cooperation.js').read_text().replace('export ','')
server=(root/'tools/leaderboard/cooperation-server.txt').read_text()
p.write_text(s+'\n\n// BEGIN GENERATED COOPERATION\n'+core+'\n'+server)
