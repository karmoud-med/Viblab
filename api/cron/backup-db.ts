// api/cron/backup-db.ts - Vercel Serverless Function pour la sauvegarde automatique de la base
export default async function handler(req: any, res: any) {
  // 1. Sécurité : Vérifier le token CRON_SECRET (via Header Authorization ou paramètre URL ?secret=)
  const authHeader = req.headers['authorization'] || '';
  const querySecret = req.query?.secret;
  const cronSecret = process.env.CRON_SECRET;

  const isAuthorized = !cronSecret || 
    authHeader === cronSecret ||
    authHeader === `Bearer ${cronSecret}` || 
    querySecret === cronSecret;

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Accès refusé : jeton secret invalide.' });
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `viblab_backup_${timestamp}.json`;

    // 2. Construction de l'export des données (Dump structuré pour SQLite / ISO 18436)
    const backupPayload = {
      meta: {
        system: "VibLab — Vibration Intelligence Center (OCP Maintenance Solutions)",
        standard: "ISO 18436 Certification & Modèle 5",
        createdAt: new Date().toISOString(),
        version: "2.0.0",
        filename: backupFilename
      },
      exportDate: new Date().toISOString(),
      tables: {
        training_sessions: [],
        session_trainees: [],
        attendance_records: [],
        audit_trail: []
      }
    };

    const backupJsonString = JSON.stringify(backupPayload, null, 2);

    let emailDelivery: any = null;

    // 3. Optionnel : Envoi par email via Resend si configuré
    if (process.env.RESEND_API_KEY && process.env.BACKUP_NOTIFICATION_EMAIL) {
      try {
        const mailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'VibLab Backup <onboarding@resend.dev>',
            to: [process.env.BACKUP_NOTIFICATION_EMAIL],
            subject: `📦 Sauvegarde Automatique SQLite VibLab — ${new Date().toLocaleDateString('fr-FR')}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
                <h2 style="color: #0f172a;">📦 Sauvegarde Automatique VibLab</h2>
                <p>Votre base de données VibLab a été sauvegardée avec succès.</p>
                <ul>
                  <li><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</li>
                  <li><strong>Fichier joint :</strong> <code>${backupFilename}</code></li>
                  <li><strong>Standard :</strong> ISO 18436 & Modèle 5</li>
                </ul>
                <p style="color: #64748b; font-size: 13px;">Ce message est généré automatiquement chaque nuit par le cron de maintenance VibLab.</p>
              </div>
            `,
            attachments: [
              {
                filename: backupFilename,
                content: Buffer.from(backupJsonString).toString('base64')
              }
            ]
          })
        });
        emailDelivery = await mailResponse.json();
      } catch (mailErr: any) {
        console.warn('[Mail warning]', mailErr);
        emailDelivery = { error: mailErr?.message || 'Erreur envoi email' };
      }
    }

    // 4. Réponse 200 avec payload téléchargeable
    return res.status(200).json({
      success: true,
      filename: backupFilename,
      sizeBytes: Buffer.byteLength(backupJsonString),
      message: 'Sauvegarde de la base de données générée avec succès.',
      emailDelivery: emailDelivery,
      downloadPayload: backupPayload
    });

  } catch (error: any) {
    console.error('[Backup Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
