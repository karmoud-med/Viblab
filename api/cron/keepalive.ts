// api/cron/keepalive.ts - Vercel Serverless Function Keep-Alive
export default async function handler(req: any, res: any) {
  // 1. Keep-Alive public pour le maintien de l'instance éveillée (libre d'accès)
  const timestamp = new Date().toISOString();
  console.log(`[Cron Keep-Alive] Ping exécuté avec succès à ${timestamp}`);

  return res.status(200).json({
    status: 'ok',
    service: 'VibLab Serverless',
    timestamp,
    message: 'Instance maintenue éveillée sans Cold Start.'
  });
}
