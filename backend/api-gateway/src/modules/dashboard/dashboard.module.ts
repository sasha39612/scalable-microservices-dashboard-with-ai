import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { AIClient } from '../../services/ai.client';
import { WorkerClient } from '../../services/worker.client';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [DashboardService, DashboardResolver, AIClient, WorkerClient],
  exports: [DashboardService],
})
export class DashboardModule {}
