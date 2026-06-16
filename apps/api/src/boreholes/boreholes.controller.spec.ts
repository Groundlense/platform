import { Test, TestingModule } from '@nestjs/testing';
import { BoreholesController } from './boreholes.controller';

describe('BoreholesController', () => {
  let controller: BoreholesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoreholesController],
    }).compile();

    controller = module.get<BoreholesController>(BoreholesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
