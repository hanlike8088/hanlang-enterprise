import { Injectable, NotFoundException } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

// SPC constants for control limit calculations
const d2: Record<number, number> = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
const D3: Record<number, number> = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 };
const D4: Record<number, number> = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 };
const A2: Record<number, number> = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };

export interface SpcChartData {
  labels: string[];
  values: number[];
  mean: number;
  ucl: number;
  lcl: number;
  usl?: number;
  lsl?: number;
}

@Injectable()
export class SpcService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  onModuleInit() {
    // seeding handled by CodingRuleService
  }

  // ========== Study CRUD ==========

  async createStudy(data: any) {
    const studyCode = await this.codingRule.generate('SPC_STUDY');
    return this.prisma.spcStudy.create({ data: { studyCode, ...data } });
  }

  async getStudies(chartType?: string, status?: string, keyword?: string) {
    const where: any = {};
    if (chartType) where.chartType = chartType;
    if (status) where.status = status;
    if (keyword) where.OR = [
      { studyName: { contains: keyword } },
      { characteristic: { contains: keyword } },
    ];
    return this.prisma.spcStudy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { measurements: true } } },
    });
  }

  async getStudy(id: string) {
    const study = await this.prisma.spcStudy.findUnique({ where: { id } });
    if (!study) throw new NotFoundException('SPC研究不存在');
    return study;
  }

  async updateStudy(id: string, data: any) {
    await this.getStudy(id);
    return this.prisma.spcStudy.update({ where: { id }, data });
  }

  async deleteStudy(id: string) {
    await this.getStudy(id);
    return this.prisma.spcStudy.delete({ where: { id } });
  }

  // ========== Measurement CRUD ==========

  async addMeasurement(studyId: string, data: any) {
    await this.getStudy(studyId);
    return this.prisma.spcMeasurement.create({ data: { studyId, ...data } });
  }

  async addMeasurementsBatch(studyId: string, measurements: any[]) {
    await this.getStudy(studyId);
    return this.prisma.spcMeasurement.createMany({
      data: measurements.map(m => ({ studyId, ...m })),
    });
  }

  async getMeasurements(studyId: string, subgroupNo?: number) {
    const where: any = { studyId };
    if (subgroupNo !== undefined) where.subgroupNo = subgroupNo;
    return this.prisma.spcMeasurement.findMany({
      where,
      orderBy: [{ subgroupNo: 'asc' }, { sampleNo: 'asc' }],
    });
  }

  async deleteMeasurement(id: string) {
    return this.prisma.spcMeasurement.delete({ where: { id } });
  }

  // ========== SPC Chart Calculations ==========

  async computeChart(studyId: string) {
    const study = await this.getStudy(studyId);
    const measurements = await this.getMeasurements(studyId);
    return this.calculateSpcChart(study, measurements);
  }

  calculateSpcChart(study: any, measurements: any[]) {
    const { chartType, subgroupSize, specificationHigh, specificationLow } = study;
    const n = subgroupSize || 5;

    // Group measurements by subgroup
    const groups = new Map<number, number[]>();
    for (const m of measurements) {
      if (!groups.has(m.subgroupNo)) groups.set(m.subgroupNo, []);
      groups.get(m.subgroupNo)!.push(m.measuredValue);
    }

    if (groups.size === 0) {
      return { labels: [], values: [], mean: 0, ucl: 0, lcl: 0 };
    }

    if (chartType === 'xbar-r') {
      return this.computeXbarR(groups, n, specificationHigh, specificationLow);
    } else if (chartType === 'xbar-s') {
      return this.computeXbarS(groups, n, specificationHigh, specificationLow);
    } else if (chartType === 'x-mr') {
      return this.computeXMr(groups, specificationHigh, specificationLow);
    } else if (chartType === 'p-chart') {
      return this.computePChart(groups, specificationHigh, specificationLow);
    } else if (chartType === 'np-chart') {
      return this.computeNpChart(groups, specificationHigh, specificationLow);
    }
    return this.computeXbarR(groups, n, specificationHigh, specificationLow);
  }

  private computeXbarR(groups: Map<number, number[]>, n: number, usl?: number, lsl?: number) {
    const subgroups: { label: string; xbar: number; range: number }[] = [];
    for (const [_, vals] of groups) {
      const sum = vals.reduce((a, b) => a + b, 0);
      const xbar = sum / vals.length;
      const range = Math.max(...vals) - Math.min(...vals);
      subgroups.push({ label: `S${subgroups.length + 1}`, xbar, range });
    }

    const grandAvg = subgroups.reduce((s, g) => s + g.xbar, 0) / subgroups.length;
    const meanRange = subgroups.reduce((s, g) => s + g.range, 0) / subgroups.length;

    const a2 = A2[n] || A2[5];
    const d4 = D4[n] || D4[5];
    const d3 = D3[n] || D3[5];

    return {
      chartType: 'xbar-r',
      xbarData: {
        labels: subgroups.map(g => g.label),
        values: subgroups.map(g => round(g.xbar)),
        mean: round(grandAvg),
        ucl: round(grandAvg + a2 * meanRange),
        lcl: round(grandAvg - a2 * meanRange),
        usl: usl ?? undefined,
        lsl: lsl ?? undefined,
      },
      rangeData: {
        labels: subgroups.map(g => g.label),
        values: subgroups.map(g => round(g.range)),
        mean: round(meanRange),
        ucl: round(d4 * meanRange),
        lcl: round(d3 * meanRange),
      },
      summary: {
        grandAverage: round(grandAvg),
        meanRange: round(meanRange),
        subgroupCount: subgroups.length,
        cp: usl && lsl ? round((usl - lsl) / (6 * meanRange / (d2[n] || d2[5]))) : undefined,
        cpk: usl && lsl ? round(Math.min(
          (usl - grandAvg) / (3 * meanRange / (d2[n] || d2[5])),
          (grandAvg - lsl) / (3 * meanRange / (d2[n] || d2[5]))
        )) : undefined,
      },
    };
  }

  private computeXbarS(groups: Map<number, number[]>, n: number, usl?: number, lsl?: number) {
    return {
      ...this.computeXbarR(groups, n, usl, lsl),
      chartType: 'xbar-s',
    };
  }

  private computeXMr(groups: Map<number, number[]>, usl?: number, lsl?: number) {
    const values: { label: string; value: number; mr: number }[] = [];
    let prev: number | null = null;
    for (const [_, vals] of groups) {
      const v = vals[0];
      const mr = prev !== null ? Math.abs(v - prev) : 0;
      values.push({ label: `X${values.length + 1}`, value: v, mr });
      prev = v;
    }

    const avg = values.reduce((s, g) => s + g.value, 0) / values.length;
    const mrValues = values.slice(1).map(v => v.mr);
    const avgMR = mrValues.length > 0 ? mrValues.reduce((s, r) => s + r, 0) / mrValues.length : 0;
    const d2_n = d2[2]; // for I-MR, n=2

    return {
      chartType: 'x-mr',
      xData: {
        labels: values.map(g => g.label),
        values: values.map(g => round(g.value)),
        mean: round(avg),
        ucl: round(avg + 2.66 * avgMR),
        lcl: round(avg - 2.66 * avgMR),
        usl: usl ?? undefined,
        lsl: lsl ?? undefined,
      },
      mrData: {
        labels: values.slice(1).map((_, i) => `MR${i + 1}`),
        values: mrValues.map(v => round(v)),
        mean: round(avgMR),
        ucl: round(3.267 * avgMR),
        lcl: 0,
      },
      summary: {
        average: round(avg),
        avgMovingRange: round(avgMR),
        count: values.length,
        cp: usl && lsl ? round((usl - lsl) / (6 * avgMR / d2_n)) : undefined,
        cpk: usl && lsl ? round(Math.min(
          (usl - avg) / (3 * avgMR / d2_n),
          (avg - lsl) / (3 * avgMR / d2_n)
        )) : undefined,
      },
    };
  }

  private computePChart(groups: Map<number, number[]>, usl?: number, lsl?: number) {
    return this.computeAttributeChart(groups, 'p', usl, lsl);
  }

  private computeNpChart(groups: Map<number, number[]>, usl?: number, lsl?: number) {
    return this.computeAttributeChart(groups, 'np', usl, lsl);
  }

  private computeAttributeChart(groups: Map<number, number[]>, type: string, usl?: number, lsl?: number) {
    const points: { label: string; value: number }[] = [];
    for (const [_, vals] of groups) {
      // For attribute charts, values represent defect count (first val) and sample size (second val)
      const defectCount = vals[0];
      const sampleSize = vals.length > 1 ? vals[1] : 1;
      points.push({ label: `P${points.length + 1}`, value: type === 'p' ? defectCount / sampleSize : defectCount });
    }

    const avg = points.reduce((s, p) => s + p.value, 0) / points.length;
    const stdev = Math.sqrt(avg * (1 - (type === 'p' ? avg : avg / 100)) / 100); // simplified

    return {
      chartType: type + '-chart',
      data: {
        labels: points.map(p => p.label),
        values: points.map(p => round(p.value)),
        mean: round(avg),
        ucl: round(avg + 3 * stdev),
        lcl: Math.max(0, round(avg - 3 * stdev)),
        usl: usl ?? undefined,
        lsl: lsl ?? undefined,
      },
      summary: {
        average: round(avg),
        count: points.length,
      },
    };
  }
}

function round(v: number, digits = 4): number {
  return Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits);
}
