"""ChatGPT가 만든 그림을 게임에 맞게 정리한다.

하는 일
  1. 파일 이름을 게임 파일명으로 맞춘다 (예: '충남이.png' → pilot_chungnami.png)
  2. 흰색·단색 배경을 투명하게 지운다 (배경 그림은 그대로)
  3. 둘레의 빈 여백을 잘라 내고 정사각형으로 맞춘다 (시트 그림은 칸이 어긋나지 않게 자르지 않음)
  4. 너무 큰 그림은 줄인다 (캐릭터 512px, 보스 768px, 배경 가로 1080px)
  5. assets/img/ 에 PNG로 저장하고, 무엇을 했는지 표로 보여 준다

쓰는 법 (이 폴더 기준)
  pip install pillow
  python tools/prepare_images.py 받은그림폴더
  python tools/prepare_images.py 받은그림폴더 --dry     # 저장하지 않고 결과만 보기
"""
import argparse
import re
import sys
import unicodedata
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow가 필요해요: pip install pillow')

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'img'

# 게임 파일명 → 이름에 들어 있으면 그 파일로 보는 낱말들
TARGETS = {
    'title_keyart': ['키아트', 'keyart', '타이틀일러스트', '타이틀화면'],
    'title_logo': ['로고', 'logo'],
    'bg_base': ['기지', '격납고배경', 'base'],
    'ui_card_back': ['카드뒷면', 'cardback'],
    'ui_ultimate_sheet': ['필살기', 'ultimate'],
    'enemy_sheet': ['졸개', '적시트', 'enemy'],
    'fx_items_sheet': ['아이템', '탄환', 'items'],
    'unit_drone': ['드론유닛', 'unitdrone'],
    'frame_duo_legend': ['테두리', 'frame'],
    'pilot_chungnami': ['충남이', 'chungnami'],
    'pilot_centeri': ['센터이', 'centeri'],
    'pilot_edui': ['에듀이', 'edui'],
    'ship_byeolbit_hangar': ['별빛호격납고', 'byeolbithangar'],
    'ship_byeolbit': ['별빛호', 'byeolbit'],
    'ship_drone_hangar': ['드론호격납고', 'dronehangar'],
    'ship_drone': ['드론호', 'shipdrone'],
    'ship_beongae_hangar': ['번개호격납고', 'beongaehangar'],
    'ship_beongae': ['번개호', 'beongae'],
    'god_gyeryong': ['계룡수호신', 'godgyeryong', '계룡초상'],
    'god_geumgang': ['금강수호신', 'godgeumgang', '금강초상'],
    'god_seohae': ['서해수호신', 'godseohae', '서해초상'],
    'god_baekje': ['백제수호신', 'godbaekje', '백제초상'],
    'god_chilgap': ['칠갑수호신', 'godchilgap', '칠갑초상'],
    'god_taean': ['태안수호신', 'godtaean', '태안초상'],
    'gift_gyeryong_sheet': ['계룡가호', 'giftgyeryong'],
    'gift_geumgang_sheet': ['금강가호', 'giftgeumgang'],
    'gift_seohae_sheet': ['서해가호', 'giftseohae'],
    'gift_baekje_sheet': ['백제가호', 'giftbaekje'],
    'gift_chilgap_sheet': ['칠갑가호', 'giftchilgap'],
    'gift_taean_sheet': ['태안가호', 'gifttaean'],
    'boss_blackhole': ['블랙홀', 'blackhole'],
    'boss_scroller': ['무한스크롤러', '스크롤러', 'scroller'],
    'boss_copybot': ['대필봇', 'copybot'],
    'boss_deepfaker': ['딥페이커', 'deepfaker'],
    'boss_cloud': ['먹구름', 'cloud'],
    'boss_thorn': ['가시덩굴', 'thorn'],
    'boss_slot': ['슬롯킹', 'slot'],
    'boss_octopus': ['문어', 'octopus'],
    'boss_smog': ['스모그', 'smog'],
    'boss_ai_core': ['ai코어', '폭주ai', 'aicore'],
    'bg_asan': ['아산배경', 'bgasan'],
    'bg_gongju': ['공주배경', 'bggongju'],
    'bg_buyeo': ['부여배경', 'bgbuyeo'],
    'bg_boryeong': ['보령배경', 'bgboryeong'],
    'bg_naepo': ['내포배경', 'bgnaepo'],
    'zodiac_rat': ['쥐', 'rat'], 'zodiac_ox': ['소', 'ox'], 'zodiac_tiger': ['호랑이', 'tiger'],
    'zodiac_rabbit': ['토끼', 'rabbit'], 'zodiac_dragon': ['용', 'dragon'], 'zodiac_snake': ['뱀', 'snake'],
    'zodiac_horse': ['말', 'horse'], 'zodiac_sheep': ['양', 'sheep'], 'zodiac_monkey': ['원숭이', 'monkey'],
    'zodiac_rooster': ['닭', 'rooster'], 'zodiac_dog': ['개', 'dog'], 'zodiac_pig': ['돼지', 'pig'],
}

# 종류별 처리 방식
BACKGROUND = {'title_keyart', 'bg_base', 'bg_asan', 'bg_gongju', 'bg_buyeo', 'bg_boryeong', 'bg_naepo'}
SHEET = {'enemy_sheet', 'fx_items_sheet', 'ui_ultimate_sheet', 'frame_duo_legend'} | {k for k in TARGETS if k.startswith('gift_')}
KEEP_BG = {'ui_card_back'} | BACKGROUND


def norm(s):
    s = unicodedata.normalize('NFC', s).lower()
    return re.sub(r'[\s_\-.·()\[\]]', '', s)


def match(path):
    """파일 이름으로 게임 파일명을 찾는다. 정확한 이름 → 긴 낱말 우선 순서."""
    stem = norm(path.stem)
    for t in TARGETS:
        if stem == norm(t):
            return t
    best, best_len = None, 0
    for t, words in TARGETS.items():
        for w in words:
            nw = norm(w)
            if len(nw) == 1:   # 한 글자 동물 이름은 이름 전체가 그 글자일 때만
                if stem == nw or stem.startswith('zodiac' + nw) or stem.endswith(nw) and len(stem) <= 3:
                    if len(nw) > best_len:
                        best, best_len = t, len(nw)
                continue
            if nw in stem and len(nw) > best_len:
                best, best_len = t, len(nw)
    return best


def remove_flat_background(im, tol=38):
    """가장자리에서 이어진 비슷한 색(흰 배경·단색 배경)을 투명하게. 그림 안쪽 흰색은 남긴다."""
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    a_vals = [px[x, y][3] for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]]
    if min(a_vals) < 20:
        return im, '이미 투명'
    corners = [px[x, y][:3] for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)]]
    ref = tuple(sorted(c[i] for c in corners)[len(corners) // 2] for i in range(3))
    close = lambda c: abs(c[0] - ref[0]) + abs(c[1] - ref[1]) + abs(c[2] - ref[2]) <= tol * 3
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    cleared = 0
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        c = px[x, y]
        if not close(c):
            continue
        px[x, y] = (c[0], c[1], c[2], 0)
        cleared += 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    # 경계 1px 부드럽게: 투명 옆 픽셀 중 배경색에 가까운 것은 반투명
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            c = px[x, y]
            if c[3] and (px[x - 1, y][3] == 0 or px[x + 1, y][3] == 0 or px[x, y - 1][3] == 0 or px[x, y + 1][3] == 0):
                d = abs(c[0] - ref[0]) + abs(c[1] - ref[1]) + abs(c[2] - ref[2])
                if d < tol * 6:
                    px[x, y] = (c[0], c[1], c[2], int(255 * d / (tol * 6)))
    ratio = cleared / (w * h)
    return im, f'배경 {ratio:.0%} 지움 (기준색 #{ref[0]:02x}{ref[1]:02x}{ref[2]:02x})'


def trim_square(im, pad=0.04):
    bbox = im.getbbox()
    if not bbox:
        return im
    im = im.crop(bbox)
    w, h = im.size
    side = int(max(w, h) * (1 + pad * 2))
    out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    out.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return out


GRID = {'enemy_sheet': (3, 2), 'fx_items_sheet': (6, 1), 'ui_ultimate_sheet': (3, 1), 'frame_duo_legend': (3, 1)}


def segments(profile, want, min_gap=4):
    """투명도 합계 줄(profile)에서 그림이 있는 구간을 찾아 큰 것부터 want개."""
    segs, start, gap = [], None, 0
    for i, v in enumerate(profile + [0] * (min_gap + 1)):
        if v > 0:
            if start is None: start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap > min_gap:
                segs.append((start, i - gap + 1)); start, gap = None, 0
    segs = sorted(segs, key=lambda s: s[1] - s[0], reverse=True)[:want]
    return sorted(segs)


def regrid(im, cols, rows, cell=384):
    """ChatGPT 시트는 칸 간격이 고르지 않을 때가 많다. 그림 덩어리를 찾아 같은 크기 칸에 다시 놓는다."""
    a = im.split()[-1]
    w, h = im.size
    ap = a.load()
    rowp = [sum(1 for x in range(0, w, 2) if ap[x, y] > 30) for y in range(h)]
    rseg = segments(rowp, rows) if rows > 1 else [(0, h)]
    if len(rseg) != rows:
        return None
    pieces = []
    for y0, y1 in rseg:
        colp = [sum(1 for y in range(y0, y1, 2) if ap[x, y] > 30) for x in range(w)]
        cseg = segments(colp, cols)
        if len(cseg) != cols:
            return None
        for x0, x1 in cseg:
            pieces.append(im.crop((x0, y0, x1, y1)))
    out = Image.new('RGBA', (cell * cols, cell * rows), (0, 0, 0, 0))
    for i, pc in enumerate(pieces):
        pc = trim_square(pc, 0.06)
        pc = pc.resize((cell, cell), Image.LANCZOS)
        out.paste(pc, ((i % cols) * cell, (i // cols) * cell), pc)
    return out


def limit(im, max_side):
    w, h = im.size
    k = max_side / max(w, h)
    return im.resize((round(w * k), round(h * k)), Image.LANCZOS) if k < 1 else im


def process(src, target):
    im = Image.open(src)
    notes = []
    if target in BACKGROUND:
        im = im.convert('RGB')
        im = im.resize((1080, round(im.height * 1080 / im.width)), Image.LANCZOS) if im.width != 1080 else im
        notes.append('배경: 가로 1080px')
        return im, notes
    if target not in KEEP_BG:
        im, n = remove_flat_background(im)
        notes.append(n)
    else:
        im = im.convert('RGBA')
    if target in SHEET:
        cols, rows = GRID.get(target, (5, 1))
        g = regrid(im, cols, rows)
        if g is not None:
            notes.append(f'시트: {cols}×{rows}칸으로 다시 맞춤')
            return g, notes
        im = limit(im, 2048)
        notes.append(f'시트: 그림 {cols * rows}개를 못 찾아 원본 칸 유지 (확인 필요)')
        return im, notes
    im = trim_square(im)
    side = 768 if target.startswith('boss_') or target == 'title_logo' else 512
    im = limit(im, side)
    notes.append(f'여백 자르고 {im.width}px')
    return im, notes


def main():
    ap = argparse.ArgumentParser(description='ChatGPT 그림을 게임 파일로 정리')
    ap.add_argument('src', help='받은 그림이 있는 폴더')
    ap.add_argument('--dry', action='store_true', help='저장하지 않고 결과만 보기')
    a = ap.parse_args()
    src = Path(a.src)
    files = sorted(p for p in src.rglob('*') if p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'})
    if not files:
        sys.exit(f'{src} 에 그림 파일이 없어요')
    OUT.mkdir(parents=True, exist_ok=True)
    done, unknown, dup = {}, [], []
    for f in files:
        t = match(f)
        if not t:
            unknown.append(f.name); continue
        if t in done:
            dup.append(f'{f.name} → {t} (이미 {done[t]} 사용)'); continue
        im, notes = process(f, t)
        if not a.dry:
            im.save(OUT / f'{t}.png', optimize=True)
        done[t] = f.name
        print(f'  ✓ {f.name:32} → {t}.png  ·  {", ".join(notes)}')
    missing = [t for t in TARGETS if t not in done and not (OUT / f'{t}.png').exists()]
    print(f'\n정리 {len(done)}장{" (저장 안 함)" if a.dry else ""} · 이름을 못 알아본 그림 {len(unknown)}장 · 아직 없는 그림 {len(missing)}장')
    if unknown:
        print('  이름을 못 알아본 그림 (파일 이름을 게임 파일명으로 바꿔 다시 실행):', ', '.join(unknown))
    if dup:
        print('  겹친 그림:', '; '.join(dup))
    if missing:
        print('  아직 없는 그림:', ', '.join(missing))


if __name__ == '__main__':
    main()
