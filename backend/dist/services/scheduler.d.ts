import { PrismaClient } from '@prisma/client';
/**
 * Initialize the scheduler
 */
export declare function initScheduler(prismaClient: PrismaClient): void;
/**
 * Manually trigger post generation for a persona
 */
export declare function generatePostNow(personaId: string, topic: string, accountId?: string): Promise<string>;
//# sourceMappingURL=scheduler.d.ts.map