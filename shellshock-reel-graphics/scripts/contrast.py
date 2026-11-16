"""WCAG contrast of card text vs the glass/background BESIDE it (sampled from empty glass, not from the text).
usage: python3 scripts/contrast.py out/stills/FullPreview-21.0s.png ...  (rundown stills, FullPreview comp)"""
import sys, numpy as np
from PIL import Image
def lin(c): c=c/255.0; return np.where(c<=0.03928,c/12.92,((c+0.055)/1.055)**2.4)
def lum(rgb): r,g,b=[lin(rgb[...,i]) for i in range(3)]; return 0.2126*r+0.7152*g+0.0722*b
def cr(a,b): hi,lo=max(a,b),min(a,b); return (hi+0.05)/(lo+0.05)
# (zone name, x0,x1,y0,y1 of EMPTY glass next to the element, text rgb, text alpha)
ZONES={
 "21.0":[("label",580,720,540,575,(244,255,246),.66),("number",640,860,780,880,(244,255,246),1),("name",520,730,935,985,(244,255,246),.95)],
 "27.0":[("label",580,720,540,575,(244,255,246),.66),("number",790,880,780,880,(244,255,246),1),("name",720,740,960,1000,(244,255,246),.95)],
 "33.0":[("label",580,720,540,575,(244,255,246),.66),("number",520,860,690,790,(244,255,246),1),("name",520,740,815,840,(244,255,246),.95),("tag",700,860,1195,1250,(57,255,20),1)],
 "40.0":[("label",580,720,540,575,(244,255,246),.66),("number",420,860,780,880,(244,255,246),1),("name",560,740,965,1000,(244,255,246),.95)],
 "46.0":[("label",580,720,540,575,(244,255,246),.66),("number",560,860,780,880,(244,255,246),1),("name",720,745,930,1030,(244,255,246),.95)],
 "55.0":[("label",420,760,490,525,(255,241,194),1),("number",640,880,780,880,(232,194,106),1),("name",560,760,975,1015,(232,194,106),1),("tag",120,170,1250,1290,(255,241,194),1)],
}
worst=99
for p in sys.argv[1:]:
    key=[k for k in ZONES if f"-{k}s" in p][0]
    im=np.asarray(Image.open(p).convert('RGB')).astype(float); res=[]
    for name,x0,x1,y0,y1,rgb,a in ZONES[key]:
        bgc=np.median(im[y0:y1,x0:x1].reshape(-1,3),axis=0)
        tc=a*np.array(rgb)+(1-a)*bgc
        c=cr(lum(tc),lum(bgc)); worst=min(worst,c); res.append(f"{name} {c:4.1f}")
    print(f"{key:>5}s  "+"   ".join(res))
print(f"worst: {worst:.1f}:1   (WCAG: >=4.5 body text, >=3 large/bold text)")
