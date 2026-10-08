// api/cron/keepalive.ts - Vercel Serverless Function Keep-Alive
export default async function handler(req: any, res: any) {
  // 1. Keep-Alive public pour le maintien de l'instance éveillée (ou avec secret si fourni)
  const authHeader = req.headers['authorization'] || '';
  const querySecret = req.query?.secret;
  const expectedSecret = process.env.CRON_SECRET;

  // Si un secret est configuré, on valide avec ou sans le préfixe 'Bearer ' ou via ?secret=
  if (expectedSecret && authHeader && authHeader !== expectedSecret && authHeader !== `Bearer ${expectedSecret}` && querySecret !== expectedSecret) {
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
