import { Test } from '@nestjs/testing';
import { AttendeesService } from './attendees.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Attendee, AttendeeAnswerEnum } from './attendee.entity';
import { Repository } from 'typeorm';

describe('AttendeeService', () => {
  let repository: Repository<Attendee>;
  let service: AttendeesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AttendeesService,
        {
          provide: getRepositoryToken(Attendee),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            where: jest.fn(),
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AttendeesService>(AttendeesService);
    repository = module.get<Repository<Attendee>>(getRepositoryToken(Attendee));
  });

  describe('createOrUpdate', () => {
    it('should create & update attendee', async () => {
      const fineOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(undefined);

      const saveSpy = jest.spyOn(repository, 'save').mockResolvedValue(
        new Attendee({
          eventId: 1,
          userId: 1,
          answer: AttendeeAnswerEnum.Accepted,
        }),
      );

      expect(
        await service.createOrUpdate(
          { answer: AttendeeAnswerEnum.Accepted },
          1,
          1,
        ),
      ).toEqual(
        new Attendee({
          eventId: 1,
          userId: 1,
          answer: AttendeeAnswerEnum.Accepted,
        }),
      );

      expect(fineOneSpy).toHaveBeenCalledTimes(1);
      expect(fineOneSpy).toHaveBeenCalledWith({
        where: { event: { id: 1 }, user: { id: 1 } },
      });
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(saveSpy).toHaveBeenCalledWith(
        new Attendee({
          eventId: 1,
          userId: 1,
          answer: AttendeeAnswerEnum.Accepted,
        }),
      );
    });
  });
});
