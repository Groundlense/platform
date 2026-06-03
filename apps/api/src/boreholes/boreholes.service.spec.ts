import { Test, TestingModule } from '@nestjs/testing';
import { BoreholesService } from './boreholes.service';

describe('BoreholesService', () => {
  let service: BoreholesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoreholesService],
    }).compile();

    service = module.get<BoreholesService>(BoreholesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
