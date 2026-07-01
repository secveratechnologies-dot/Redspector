import shutil
import os

base_dir = r"c:\Users\athar\OneDrive\Desktop\RedSpectre"

def safe_rm(path):
    p = os.path.join(base_dir, path)
    if os.path.exists(p):
        if os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
        else:
            os.remove(p)

safe_rm(r"threat_service\alembic.ini")
safe_rm(r"threat_service\alembic")

shutil.copy(os.path.join(base_dir, r"asset_service\alembic.ini"), os.path.join(base_dir, r"threat_service\alembic.ini"))
shutil.copytree(os.path.join(base_dir, r"asset_service\alembic"), os.path.join(base_dir, r"threat_service\alembic"))

versions_dir = os.path.join(base_dir, r"threat_service\alembic\versions")
for file in os.listdir(versions_dir):
    if file.endswith('.py'):
        os.remove(os.path.join(versions_dir, file))
