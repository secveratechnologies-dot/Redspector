import prisma from '../config/db.js';
import { enqueueCampaign } from './campaignQueue.js';

let schedulerIntervalId = null;

export const startScheduler = () => {
  if (schedulerIntervalId) return;
  console.log('[Scheduler] Job scheduler started.');

  schedulerIntervalId = setInterval(async () => {
    try {
      // Find campaigns in "Approved" state
      const approvedCampaigns = await prisma.campaign.findMany({
        where: { status: 'Approved' }
      });

      for (const campaign of approvedCampaigns) {
        console.log(`[Scheduler] Automatically scheduling approved campaign: ${campaign.id}`);
        // Transition status to Pending and enqueue
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'Pending' }
        });
        await enqueueCampaign(campaign.id);
      }
    } catch (error) {
      console.error('[Scheduler Error]:', error.message);
    }
  }, 5000); // Check every 5 seconds
};

export const stopScheduler = () => {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    console.log('[Scheduler] Job scheduler stopped.');
  }
};
