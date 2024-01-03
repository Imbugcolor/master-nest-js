import { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../auth/user.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import * as paginator from '../pagination/paginator';
import { ListEvents } from './input/list.events';

jest.mock('../pagination/paginator');

describe('EventsService', () => {
  let service: EventsService;
  let repository: Repository<Event>;
  let selectQb;
  let deleteQb;
  let mockedPaginate;

  beforeEach(async () => {
    mockedPaginate = paginator.paginate as jest.Mock;
    deleteQb = {
      where: jest.fn(),
      execute: jest.fn(),
    };

    selectQb = {
      where: jest.fn(),
      delete: jest.fn().mockReturnValue(deleteQb),
      execute: jest.fn(),
      orderBy: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      loadRelationCountAndMap: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            save: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(selectQb),
            where: jest.fn(),
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get<Repository<Event>>(getRepositoryToken(Event));
  });

  describe('updateEvent', () => {
    it('should update the event', async () => {
      const repoSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ id: 1 } as Event);

      const serviceSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(new Event({ id: 1, organizerId: 1 }));

      expect(
        await service.updateEvent(1, { name: 'new name' }, new User({ id: 1 })),
      ).toEqual({ id: 1 });

      expect(repoSpy).toHaveBeenCalledWith(
        new Event({ id: 1, name: 'new name', organizerId: 1, when: undefined }),
      );
      expect(serviceSpy).toHaveBeenCalledWith(1);
    });

    it('should return not found exception when update the event does not exist', async () => {
      const repoSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ id: 1 } as Event);

      const serviceSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(undefined);

      try {
        await service.updateEvent(1, { name: 'new name' }, new User({ id: 1 }));
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }

      expect(repoSpy).toHaveBeenCalledTimes(0);
      expect(serviceSpy).toHaveBeenCalledWith(1);
    });

    it('should return Forbidden exception when update the event has organizerId does not match with userId', async () => {
      const repoSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue({ id: 1 } as Event);

      const serviceSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(new Event({ id: 1, organizerId: 2 }));

      try {
        await service.updateEvent(1, { name: 'new name' }, new User({ id: 1 }));
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
      }

      expect(repoSpy).toHaveBeenCalledTimes(0);
      expect(serviceSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const serviceSpy = jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(new Event({ id: 1, organizerId: 1 }));

      const createQueryBuilderSpy = jest.spyOn(
        repository,
        'createQueryBuilder',
      );

      const deleteSpy = jest.spyOn(selectQb, 'delete');

      const whereSpy = jest.spyOn(deleteQb, 'where').mockReturnValue(deleteQb);

      const executeSpy = jest.spyOn(deleteQb, 'execute');

      expect(await service.deleteEvent(1, new User({ id: 1 }))).toBe(undefined);

      expect(serviceSpy).toHaveBeenCalledTimes(1);
      expect(serviceSpy).toHaveBeenCalledWith(1);

      expect(createQueryBuilderSpy).toHaveBeenCalledTimes(1);
      expect(createQueryBuilderSpy).toHaveBeenCalledWith('e');
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(whereSpy).toHaveBeenCalledTimes(1);
      expect(whereSpy).toHaveBeenCalledWith('id = :id', { id: 1 });
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEventsAttendedByUserIdQueryPaginated', () => {
    it('should return list of paginated events', async () => {
      const orderBySpy = jest
        .spyOn(selectQb, 'orderBy')
        .mockReturnValue(selectQb);

      const leftAndJoinSelectSpy = jest
        .spyOn(selectQb, 'leftJoinAndSelect')
        .mockReturnValue(selectQb);

      const whereSpy = jest.spyOn(selectQb, 'where').mockReturnValue(selectQb);

      mockedPaginate.mockResolvedValue({
        first: 1,
        last: 1,
        limit: 10,
        total: 10,
        data: [],
      });

      expect(
        await service.getEventsAttendedByUserIdQueryPaginated(500, {
          limit: 1,
          currentPage: 1,
        }),
      ).toEqual({
        first: 1,
        last: 1,
        limit: 10,
        total: 10,
        data: [],
      });

      expect(orderBySpy).toHaveBeenCalledTimes(1);
      expect(orderBySpy).toHaveBeenCalledWith('e.id', 'DESC');

      expect(leftAndJoinSelectSpy).toHaveBeenCalledTimes(1);
      expect(leftAndJoinSelectSpy).toHaveBeenCalledWith('e.attendees', 'a');

      expect(whereSpy).toHaveBeenCalledTimes(1);
      expect(whereSpy).toHaveBeenCalledWith('a.userId = :userId', {
        userId: 500,
      });

      expect(mockedPaginate).toHaveBeenCalledTimes(1);
      expect(mockedPaginate).toHaveBeenCalledWith(selectQb, {
        limit: 1,
        currentPage: 1,
      });
    });
  });

  describe('getEventsWithAttendeeCountQueryFilteredPaginated', () => {
    it('should return list of paginated events with attendee count', async () => {
      const orderBySpy = jest
        .spyOn(selectQb, 'orderBy')
        .mockReturnValue(selectQb);

      const loadRelationCountAndMap = jest
        .spyOn(selectQb, 'loadRelationCountAndMap')
        .mockReturnValue(selectQb);

      mockedPaginate.mockReturnValue({
        first: 1,
        last: 10,
        limit: 10,
        total: 10,
        data: [],
      });

      expect(
        await service.getEventsWithAttendeeCountQueryFilteredPaginated(
          new ListEvents(),
          { limit: 1, currentPage: 1 },
        ),
      ).toEqual({
        first: 1,
        last: 10,
        limit: 10,
        total: 10,
        data: [],
      });

      expect(orderBySpy).toHaveBeenCalledTimes(1);
      expect(orderBySpy).toHaveBeenCalledWith('e.id', 'DESC');

      expect(loadRelationCountAndMap).toHaveBeenCalledTimes(4);

      expect(mockedPaginate).toHaveBeenCalledWith(selectQb, {
        limit: 1,
        currentPage: 1,
      });
    });
  });
});
