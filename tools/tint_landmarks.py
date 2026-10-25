"""지역 카드 그림(흑백 원본)에 지역마다 다른 색을 입힌다 — 컬러 그림이 오기 전 임시판.
쓰는 법: python tools/tint_landmarks.py
원본: art-src/img/region_landmarks_sheet.png(흑백) → 결과: assets/img/region_landmarks_sheet.webp
GPT 컬러판을 받으면 이 도구는 쓰지 말고 그 PNG를 assets/img 에 넣은 뒤 tools/to_webp.py 를 실행한다.
"""
import sys
import numpy as np
from PIL import Image
src=Image.open('art-src/img/region_landmarks_sheet.png').convert('RGBA')
a=np.array(src).astype(float)
L=(0.299*a[...,0]+0.587*a[...,1]+0.114*a[...,2])/255.0
rects=[[0,0,525,550],[530,0,595,550],[1125,0,411,565],[0,550,575,474],[578,565,690,459]]
# 밝기 → 색 (어두움 … 밝음). 지역마다 재료 색을 떠올리게
maps={
 0:[(0,'#14243a'),(0.25,'#1f5a4a'),(0.45,'#4f8a52'),(0.62,'#a87c52'),(0.8,'#e2c08a'),(1,'#fff6e0')],   # 아산: 기와·소나무·나무·온천
 1:[(0,'#16263a'),(0.25,'#2a5a4a'),(0.45,'#6b8a62'),(0.65,'#b59a72'),(0.82,'#e0cfa6'),(1,'#fff8e6')],   # 공주: 성벽 돌
 2:[(0,'#132a2a'),(0.25,'#1f6650'),(0.45,'#5aa36a'),(0.65,'#b3b09a'),(0.85,'#e8e2d0'),(1,'#fffaf0')],   # 부여: 석탑·연못·연꽃
 3:[(0,'#10243f'),(0.28,'#1c5f95'),(0.48,'#3fa3d6'),(0.66,'#c9a874'),(0.85,'#f0dcb0'),(1,'#ffffff')],   # 보령: 바다·모래
 4:[(0,'#131c3d'),(0.25,'#2b4a8a'),(0.45,'#3f7a5a'),(0.65,'#8fa3c4'),(0.85,'#dfe6f2'),(1,'#ffffff')],   # 내포: 청사·광장
}
def hexrgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],float)
out=a.copy()
for i,(x,y,w,h) in enumerate(rects):
    stops=maps[i]; xs=np.array([s[0] for s in stops]); cs=np.stack([hexrgb(s[1]) for s in stops])
    l=L[y:y+h,x:x+w]
    # 대비를 조금 늘린 뒤 매핑
    l=np.clip((l-0.08)/0.9,0,1)
    col=np.stack([np.interp(l,xs,cs[:,k]) for k in range(3)],-1)
    out[y:y+h,x:x+w,:3]=col
res=Image.fromarray(out.clip(0,255).astype('uint8'),'RGBA')
res.save('assets/img/region_landmarks_sheet.webp', format='WEBP', quality=85, method=6, alpha_quality=95)
print('saved assets/img/region_landmarks_sheet.webp')
