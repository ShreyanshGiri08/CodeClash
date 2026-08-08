import shutil, os

src = r"C:\Users\giril\.gemini\antigravity-ide\brain\a9719efd-05a0-418b-8775-71bfedca8040\media__1786209246532.jpg"
dst_dir = r"c:\Users\giril\OneDrive\Desktop\CodeClash\frontend\public"

for name in ["coder_bg.jpg", "race_coder_bg.jpg", "user_coder_bg.jpg"]:
    dst = os.path.join(dst_dir, name)
    shutil.copy2(src, dst)
    print(f"Copied to {dst}")
