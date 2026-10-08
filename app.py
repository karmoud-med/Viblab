"""
VibLab - Serveur Flask WSGI pour déploiement PythonAnywhere
Permet d'héberger l'application React/Vite/Three.js/WASM sur PythonAnywhere.
"""

import os
from flask import Flask, send_from_directory, abort

# Chemin vers le dossier compilé dist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')

app = Flask(__name__, static_folder=DIST_DIR, static_url_path='')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """
    Gestionnaire de routes SPA (Single Page Application) :
    1. Si le fichier statique demandé existe dans dist/, on le sert.
    2. Sinon, on redirige vers index.html pour que React Router gère la navigation.
    """
    target_file = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(target_file) and not os.path.isdir(target_file):
        return send_from_directory(app.static_folder, path)
    
    index_file = os.path.join(app.static_folder, 'index.html')
    if os.path.exists(index_file):
        return send_from_directory(app.static_folder, 'index.html')
    else:
        return """
        <h2>VibLab - Build manquant</h2>
        <p>Le dossier <code>dist/</code> n'a pas été trouvé. Veuillez exécuter <code>npm run build</code> avant de déployer.</p>
        """, 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Serveur VibLab en écoute sur http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
