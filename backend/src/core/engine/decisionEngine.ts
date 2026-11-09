import { config } from '../../config/env';
import { DecisionType } from '../types';

export class DecisionEngine {
  private static approveBelow = config.frm.approveBelow;
  private static blockFrom = config.frm.blockFrom;

  public static decide(score: number): DecisionType {
    if (score >= this.blockFrom) {
      return 'BLOCK';
    }
    if (score >= this.approveBelow) {
      return 'REVIEW';
    }
    return 'ALLOW';
  }

  public static updateThresholds(approveBelow: number, blockFrom: number): void {
    this.approveBelow = approveBelow;
    this.blockFrom = blockFrom;
  }
}

