"""ローカルに保存した Depth Anything V2 Small で、試作の8枚の相対深度を再計算する。"""
from pathlib import Path
from PIL import Image
import torch
from transformers import AutoImageProcessor,AutoModelForDepthEstimation
root=Path(__file__).resolve().parents[2]
out=root/'3d-review/studio/depth'
out.mkdir(parents=True, exist_ok=True)
model='depth-anything/Depth-Anything-V2-small-hf'
pre=AutoImageProcessor.from_pretrained(model, local_files_only=True)
net=AutoModelForDepthEstimation.from_pretrained(model,local_files_only=True).eval()
torch.set_num_threads(4)
refs=['web/about-rack-600.webp','img/top_menu_ph7.jpg','photo/img/office/ph10.jpg','photo/img/office/ph09.jpg']
for key,ref in zip(['aisle','bench','table','lounge'],refs):
 for kind,file in [('concept',root/'3d-review/photos'/f'{key}.webp'),('actual',root/'動きの実験版'/ref)]:
  im=Image.open(file).convert('RGB')
  with torch.inference_mode(): raw=net(**pre(images=im,return_tensors='pt')).predicted_depth[0]
  low,high=torch.quantile(raw,torch.tensor([.01,.99]))
  pixels=((raw-low)/(high-low)).clamp(0,1).mul(255).byte().numpy()
  Image.fromarray(pixels).resize((320,round(320*im.height/im.width)),Image.Resampling.BILINEAR).save(out/f'{key}-{kind}.png')
  print(key,kind,flush=True)
