import os
import sqlite3

# ⚠️ Vulnérabilité : Exécution de commande dangereuse
user_input = input("Entrez une commande : ")
os.system(user_input)  # Exécution directe

# ⚠️ Vulnérabilité : SQL Injection
conn = sqlite3.connect('test.db')
cursor = conn.cursor()
username = input("Nom d'utilisateur : ")
query = f"SELECT * FROM users WHERE username = '{username}'"
cursor.execute(query)  # Requête SQL non sécurisée
