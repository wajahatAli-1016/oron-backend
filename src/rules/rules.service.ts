import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rule } from './rule.model';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

type SeedRule = {
  name: string;
  vitalType: string;
  category: string;
  thresholds: {
    normalMin: number;
    normalMax: number;
    lowThreshold: number;
    highThreshold: number;
    criticalLow: number;
    criticalHigh: number;
    unit: string;
  };
  isActive: boolean;
  description: string;
};

const DEFAULT_RULES: SeedRule[] = [
  {
    name: 'Systolic Blood Pressure',
    vitalType: 'systolicBP',
    category: 'Vitals',
    thresholds: {
      normalMin: 90,
      normalMax: 140,
      lowThreshold: 90,
      highThreshold: 140,
      criticalLow: 80,
      criticalHigh: 180,
      unit: 'mmHg',
    },
    isActive: true,
    description:
      'Monitors systolic blood pressure. Alerts generated when readings fall outside normal range.',
  },
  {
    name: 'Diastolic Blood Pressure',
    vitalType: 'diastolicBP',
    category: 'Vitals',
    thresholds: {
      normalMin: 60,
      normalMax: 90,
      lowThreshold: 60,
      highThreshold: 90,
      criticalLow: 50,
      criticalHigh: 110,
      unit: 'mmHg',
    },
    isActive: true,
    description:
      'Monitors diastolic blood pressure. Alerts generated when readings fall outside normal range.',
  },
  {
    name: 'Heart Rate',
    vitalType: 'heartRate',
    category: 'Vitals',
    thresholds: {
      normalMin: 60,
      normalMax: 100,
      lowThreshold: 50,
      highThreshold: 100,
      criticalLow: 40,
      criticalHigh: 130,
      unit: 'bpm',
    },
    isActive: true,
    description: 'Monitors resting heart rate. Critical alerts for extreme values.',
  },
  {
    name: 'Oxygen Saturation (SpO2)',
    vitalType: 'oxygenSaturation',
    category: 'Vitals',
    thresholds: {
      normalMin: 95,
      normalMax: 100,
      lowThreshold: 92,
      highThreshold: 100,
      criticalLow: 88,
      criticalHigh: 101,
      unit: '%',
    },
    isActive: true,
    description: 'Monitors blood oxygen levels. Critical alert below 88%.',
  },
  {
    name: 'Temperature',
    vitalType: 'temperature',
    category: 'Vitals',
    thresholds: {
      normalMin: 97,
      normalMax: 99,
      lowThreshold: 96,
      highThreshold: 100.4,
      criticalLow: 95,
      criticalHigh: 103,
      unit: 'F',
    },
    isActive: true,
    description: 'Monitors body temperature. Alerts for fever or hypothermia.',
  },
  {
    name: 'Blood Glucose',
    vitalType: 'bloodSugar',
    category: 'Vitals',
    thresholds: {
      normalMin: 70,
      normalMax: 140,
      lowThreshold: 70,
      highThreshold: 180,
      criticalLow: 60,
      criticalHigh: 250,
      unit: 'mg/dL',
    },
    isActive: true,
    description: 'Monitors blood glucose levels. Critical alerts for hypo/hyperglycemia.',
  },
];

@Injectable()
export class RulesService implements OnModuleInit {
  constructor(
    @InjectModel(Rule)
    private readonly ruleModel: typeof Rule,
  ) {}

  async onModuleInit(): Promise<void> {
    const existingCount = await this.ruleModel.count();
    if (existingCount > 0) {
      return;
    }

    await this.ruleModel.bulkCreate(DEFAULT_RULES);
  }

  async create(createRuleDto: CreateRuleDto): Promise<Rule> {
    return this.ruleModel.create({
      ...createRuleDto,
      isActive: createRuleDto.isActive ?? true,
    });
  }

  async findAll(): Promise<Rule[]> {
    return this.ruleModel.findAll({ order: [['createdAt', 'DESC']] });
  }

  async findOne(id: string): Promise<Rule> {
    const rule = await this.ruleModel.findByPk(id);
    if (!rule) {
      throw new NotFoundException('Rule not found');
    }
    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto): Promise<Rule> {
    const rule = await this.findOne(id);
    await rule.update(updateRuleDto);
    return rule;
  }

  async remove(id: string): Promise<{ message: string }> {
    const rule = await this.findOne(id);
    await rule.destroy();
    return { message: 'Rule deleted successfully' };
  }
}
