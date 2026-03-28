import { Router } from 'express';
import { pool } from '../../core/db.js'; 
import { webhookQueue } from '../../core/queue.js';

const router = Router();

router.get('/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        
        const dbResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
        
        const queueJob = await webhookQueue.getJob(jobId);

        if (dbResult.rowCount === 0 && !queueJob) {
            return res.status(404).json({ error: "Job not found" });
        }

        res.json({
            database_record: dbResult.rows[0] || "No DB record yet",
            live_queue_status: queueJob ? {
                id: queueJob.id,
                progress: queueJob.progress,
                attempts_made: queueJob.attemptsMade,
                failed_reason: queueJob.failedReason,
                status: await queueJob.getState()
            } : "Job processed and removed from Redis"
        });
    } catch (error: unknown) {
    const message =
        error instanceof Error
            ? error.message
            : "Unknown error";

    res.status(500).json({ error: message });
}
});

export default router;
