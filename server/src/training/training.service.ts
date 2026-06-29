import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CodingRuleService } from '../common/services/coding-rule.service';

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codingRule: CodingRuleService,
  ) {}

  // ===== Training Courses =====
  async createCourse(data: any) {
    const code = await this.codingRule.generate('TRAIN_COURSE');
    return this.prisma.trainingCourse.create({ data: { ...data, courseCode: code } });
  }
  async findAllCourses(type?: string, category?: string) {
    const where: any = {};
    if (type) where.courseType = type;
    if (category) where.category = category;
    return this.prisma.trainingCourse.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async findOneCourse(id: string) {
    const c = await this.prisma.trainingCourse.findUnique({ where: { id }, include: { records: true } });
    if (!c) throw new NotFoundException('课程不存在');
    return c;
  }
  async updateCourse(id: string, data: any) {
    await this.findOneCourse(id);
    return this.prisma.trainingCourse.update({ where: { id }, data });
  }
  async removeCourse(id: string) {
    await this.findOneCourse(id);
    return this.prisma.trainingCourse.delete({ where: { id } });
  }

  // ===== Training Records =====
  async createRecord(data: any) {
    const code = await this.codingRule.generate('TRAIN_RECORD');
    return this.prisma.trainingRecord.create({
      data: {
        ...data,
        recordCode: code,
        trainingDate: data.trainingDate ? new Date(data.trainingDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }
  async findAllRecords(employeeId?: string, courseId?: string, limit: number = 100) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (courseId) where.courseId = courseId;
    return this.prisma.trainingRecord.findMany({
      where,
      include: { course: { select: { courseCode: true, courseName: true } }, employee: { select: { employeeCode: true, name: true } } },
      orderBy: { trainingDate: 'desc' },
      take: limit,
    });
  }
  async getEmployeeRecords(employeeId: string) {
    return this.prisma.trainingRecord.findMany({
      where: { employeeId },
      include: { course: { select: { courseCode: true, courseName: true, courseType: true } } },
      orderBy: { trainingDate: 'desc' },
    });
  }

  // ===== Qualifications =====
  async createQualification(data: any) {
    const code = await this.codingRule.generate('TRAIN_QUAL');
    return this.prisma.qualification.create({
      data: {
        ...data,
        qualCode: code,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }
  async findAllQualifications(employeeId?: string, qualType?: string, status?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (qualType) where.qualType = qualType;
    if (status) where.status = status;
    return this.prisma.qualification.findMany({
      where,
      include: { employee: { select: { employeeCode: true, name: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }
  async getExpiringQualifications(days: number = 90) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    return this.prisma.qualification.findMany({
      where: { expiryDate: { lte: threshold }, status: 'valid' },
      include: { employee: { select: { employeeCode: true, name: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }
  async updateQualification(id: string, data: any) {
    return this.prisma.qualification.update({ where: { id }, data });
  }
  async removeQualification(id: string) {
    return this.prisma.qualification.delete({ where: { id } });
  }

  // ===== Skill Matrix =====
  async createSkill(data: any) {
    return this.prisma.skillMatrix.create({ data });
  }
  async findAllSkills(employeeId?: string, category?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (category) where.skillCategory = category;
    return this.prisma.skillMatrix.findMany({
      where,
      include: { employee: { select: { employeeCode: true, name: true } } },
      orderBy: { skillCategory: 'asc' },
    });
  }
  async updateSkill(id: string, data: any) {
    return this.prisma.skillMatrix.update({ where: { id }, data });
  }
  async removeSkill(id: string) {
    return this.prisma.skillMatrix.delete({ where: { id } });
  }

  // ===== Training Plans =====
  async createPlan(data: any) {
    const code = await this.codingRule.generate('TRAIN_PLAN');
    return this.prisma.trainingPlan.create({ data: { ...data, planCode: code } });
  }
  async findAllPlans(year?: number) {
    const where: any = {};
    if (year) where.planYear = year;
    return this.prisma.trainingPlan.findMany({ where, orderBy: { planYear: 'desc' } });
  }
  async updatePlan(id: string, data: any) {
    return this.prisma.trainingPlan.update({ where: { id }, data });
  }
  async removePlan(id: string) {
    return this.prisma.trainingPlan.delete({ where: { id } });
  }

  // ===== Dashboard stats =====
  async getStats() {
    const [courseCount, recordCount, qualCount, skillCount, planCount, expiringQuals] = await Promise.all([
      this.prisma.trainingCourse.count(),
      this.prisma.trainingRecord.count(),
      this.prisma.qualification.count(),
      this.prisma.skillMatrix.count(),
      this.prisma.trainingPlan.count(),
      this.getExpiringQualifications(),
    ]);
    return {
      courseCount, recordCount, qualCount, skillCount, planCount,
      expiringQualCount: expiringQuals.length,
      expiringQualifications: expiringQuals.slice(0, 10),
    };
  }
}
