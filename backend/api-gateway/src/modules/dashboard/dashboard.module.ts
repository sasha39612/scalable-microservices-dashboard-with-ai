import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { AIClient } from '../../services/ai.client';
import { WorkerClient } from '../../services/worker.client';
import { UserModule } from '../user/user.module';
import { DashboardInsight } from './entities/dashboard-insight.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardInsight]), UserModule],
  providers: [DashboardService, DashboardResolver, AIClient, WorkerClient],
  exports: [DashboardService],
})
export class DashboardModule {}
