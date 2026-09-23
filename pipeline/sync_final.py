import shutil, os

src = r"C:\Users\ayush\Downloads\OceanSight_SIH26067_Final_Diagrams.pptx"
targets = [
    r"C:\Users\ayush\Downloads\OceanSight_SIH26067_Final.pptx",
    r"C:\Users\ayush\Desktop\OceanSight_SIH26067_Final.pptx",
    r"C:\Users\ayush\Downloads\OceanSight_SIH26067_Final_Visual.pptx",
    r"C:\Users\ayush\Desktop\OceanSight_SIH26067_Final_Visual.pptx"
]

for dst in targets:
    try:
        shutil.copy2(src, dst)
        print(f"[OK] Successfully overwritten: {dst}")
    except PermissionError:
        print(f"[LOCKED] Cannot overwrite {dst} (currently open in PowerPoint).")
