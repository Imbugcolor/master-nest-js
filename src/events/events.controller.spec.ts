import { DeleteResult, Repository } from 'typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { ListEvents } from './input/list.events';
import { User } from './../auth/user.entity';

describe('EventsController', () => {
  let eventsService: EventsService;
  let eventsController: EventsController;
  let eventsRepository: Repository<Event>;

  beforeEach(() => {
    eventsService = new EventsService(eventsRepository);
    eventsController = new EventsController(eventsService);
  });

  it('should return a list of events', async () => {
    const result = {
      first: 1,
      last: 10,
      limit: 10,
      data: [],
    };

    // eventsService.getEventsWithAttendeeCountQueryFilteredPaginated = jest
    //   .fn()
    //   .mockImplementation((): any => result);

    const spy = jest
      .spyOn(eventsService, 'getEventsWithAttendeeCountQueryFilteredPaginated')
      .mockImplementation((): any => result);

    expect(await eventsController.findAll(new ListEvents())).toEqual(result);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should return delete result when delete event', async () => {
    const spy = jest
      .spyOn(eventsService, 'deleteEvent')
      .mockImplementation((): any => new DeleteResult());
    expect(await eventsController.remove(1, new User({ id: 1 }))).toEqual(
      new DeleteResult(),
    );
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
