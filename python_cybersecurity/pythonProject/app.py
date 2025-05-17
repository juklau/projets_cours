from enum import verify
from xml.sax.saxutils import escape

from flask import Flask, request, render_template_string, redirect
import sqlite3
import bcrypt
from html import escape

app = Flask(__name__)
DB_PATH = "../vulnerable_app.db"

@app.route("/")
def index():
    #query ==> amit az utilisateur tape
    query = request.args.get("search")
    conn = sqlite3.connect(DB_PATH)

    #cur ==> un objet SQLite permettant d'interagir avec la base
    cur = conn.cursor()
    if query:
        # ⚠️ Faille d'injection SQL
        #cur.execute(f"SELECT username FROM users WHERE username LIKE '%{query}%'") ==> eredeti
        #cur.execute("SELECT username FROM users WHERE username LIKE ?", ('%' + query +'%',))
        #il faut apprendre ça!!
        #avec "?" ==> un paramètre sécurisé qui empêche les attaques par injection SQL
        params = (query,)
        cur.execute("SELECT username FROM users WHERE username LIKE ?", params)
        results = cur.fetchall()
        conn.close()
        return f"Résultats : {results}"
    return '''
        <form method="get">
            Recherche utilisateur : <input name="search">
            <input type="submit">
        </form>
    '''
#if __name__ == "__main__":
  #app.run(debug=True)

@app.route("/login", methods=["GET", "POST"])

def login():
    error = ""
    if request.method == "POST":

        username = request.form["username"]
        password = request.form["password"].encode("utf-8")
        #salt = bcrypt.gensalt() ==> c'est inutile==> :
        # il ne faut pas générer un nouveau salt lors de la connexion, car cela empêchera toute comparaison
        #ouvrir la connexion à la base SQLite
        conn = sqlite3.connect(DB_PATH)
        #récupération un curseur pour éxecuter des requêtes
        cur = conn.cursor()

        # Récupérer le mot de passe haché depuis la base de données
        cur.execute("SELECT password FROM users WHERE username=?", (username,))
        #récupération la première ligne du résultat
        user = cur.fetchone()
        #fermeture de la connexion
        conn.close()

        if user:
            #récupération son mot de passe haché si l'utilisateur existe
            stored_hashed_password = user[0]

            #Vérifier si le mot de passe fourni correspond au mot de passe haché stocké
            if user and bcrypt.checkpw(password, stored_hashed_password.encode("utf-8")):
                return f"Bienvenue {username} !"
        error = "Échec de connexion"

    return '''
        <form method="post">
            Nom d'utilisateur : <input name="username"><br>
            Mot de passe : <input type="password" name="password"><br>
            <input type="submit" value="Connexion">
        </form>
        <p style="color:red;">{}</p>
    '''.format(error)

#aide par le prof
#import bcrypt
# example password
#password = 'passwordabc'
# converting password to array of bytes
#bytes = password.encode('utf-8')
# generating the salt
#salt = bcrypt.gensalt()
# Hashing the password
#hash = bcrypt.hashpw(bytes, salt)
# Taking user entered password
#userPassword = 'password000'
# encoding user password
#userBytes = userPassword.encode('utf-8')
# checking password
#result = bcrypt.checkpw(userBytes, hash)
#print(result)

#berakni a sql tablaba a hash-ozott passwordot
#INSERT INTO users (username, password) VALUES ('admin', '$2b$12$EXEMPLEHASHGENEREPARBCrypt...');

@app.route("/comments", methods=["GET", "POST"])
#GET : L'utilisateur affiche les commentaires existants.
#POST : L'utilisateur ajoute un commentaire.

def comments():

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    if request.method == "POST":
        username = escape(request.args.get("username")) # Protection contre XSS
        content = escape(request.args.get("content")) # Protection contre XSS

        cur.execute("INSERT INTO comments (username, content) VALUES (?, ?)",
                    (username, content))
        conn.commit()
    cur.execute("SELECT username, content FROM comments")
    all_comments = cur.fetchall()
    conn.close()

    #escape() ==> afin de ne pas être interprété < et > comme code HTML
    html = "<h2>Commentaires :</h2><ul>" #chaque commentaire est affiché dans une liste <ul>
    for user, content in all_comments:
        html += f"<li><strong>{escape(user)}</strong> : {escape(content)}</li>"
    html += "</ul><hr>"
    #l'utilisateur peut entrer son nom et son commentaire, puis soumettre le formulaire
    html += '''
        <form method="post">
            Nom : <input name="username"><br>
            Commentaire : <textarea name="content"></textarea><br>
            <input type="submit">
        </form>
    '''
    return render_template_string(html)

if __name__ == "__main__":
    app.run(debug=True, port=1234)
