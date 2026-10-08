// api/cron/keepalive.ts - Vercel Serverless Function Keep-Alive
export default async function handler(req: any, res: any) {
  // 1. Vérification de sécurité avec un secret partagé (optionnel mais recommandé)
  const authHeader = req.headers['authorization'];
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Non autorisé : Jeton CRON_SECRET invalide.' });
  }

  // 2. Tâche d'entretien et ping de l'application
  const timestamp = new Date().toISOString();
  console.log(`[Cron Keep-Alive] Ping exécuté avec succès à ${timestamp}`);

  return res.status(200).json({
    status: 'ok',
    service: 'VibLab Serverless',
    timestamp,
    message: 'Instance maintenue éveillée sans Cold Start.'
  });
}
