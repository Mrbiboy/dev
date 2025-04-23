import tempfile
import subprocess

def clone_repo(repo_url):
    temp_dir = tempfile.mkdtemp()
    subprocess.run(["git", "clone", repo_url, temp_dir], check=True)
    return temp_dir
