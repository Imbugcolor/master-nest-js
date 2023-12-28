import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { Repository } from 'typeorm';
import { AttendeeAnswerEnum } from './attendee.entity';
import { ListEvents, WhenEventsFilter } from './input/list.events';
import { PaginateOptions, paginate } from 'src/pagination/paginator';
import { CreateEventDto } from './input/create-event.dto';
import { User } from 'src/auth/user.entity';
import { UpdateEventDto } from './input/update-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  private getEventsBaseQuery() {
    return this.eventRepository.createQueryBuilder('e').orderBy('e.id', 'DESC');
  }

  private getEventsWithAttendeeCountQuery() {
    return this.getEventsBaseQuery()
      .loadRelationCountAndMap('e.attendeeCount', 'e.attendees')
      .loadRelationCountAndMap(
        'e.attendeeAccepted',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.andWhere('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Accepted,
          }),
      )
      .loadRelationCountAndMap(
        'e.attendeeMaybe',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.andWhere('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Maybe,
          }),
      )
      .loadRelationCountAndMap(
        'e.attendeeRejected',
        'e.attendees',
        'attendee',
        (qb) =>
          qb.andWhere('attendee.answer = :answer', {
            answer: AttendeeAnswerEnum.Rejected,
          }),
      );
  }

  private async getEventsWithAttendeeCountQueryFiltered(filter?: ListEvents) {
    const query = this.getEventsWithAttendeeCountQuery();

    if (!filter) {
      return query;
    }

    if (filter.when) {
      if (filter.when == WhenEventsFilter.Today) {
        query.andWhere(
          'e.when >= CURDATE() AND e.when <= CURDATE() + INTERVAL 1 DAY',
        );
      }
      if (filter.when == WhenEventsFilter.Tommorow) {
        query.andWhere(
          'e.when >= CURDATE() + INTERVAL 1 DAY AND e.when <= CURDATE() + INTERVAL 2 DAY',
        );
      }
      if (filter.when == WhenEventsFilter.ThisWeek) {
        query.andWhere('YEERWEEK(e.when, 1) = YEERWEEK(CURDATE(), 1)');
      }
      if (filter.when == WhenEventsFilter.NextWeek) {
        query.andWhere('YEERWEEK(e.when, 1) = YEERWEEK(CURDATE(), 1) + 1');
      }
    }

    return query;
  }

  public async getEventsWithAttendeeCountQueryFilteredPaginated(
    filter?: ListEvents,
    paginateOptions?: PaginateOptions,
  ) {
    return await paginate(
      await this.getEventsWithAttendeeCountQueryFiltered(filter),
      paginateOptions,
    );
  }

  public async getEvent(id: number): Promise<Event | undefined> {
    const query = this.getEventsWithAttendeeCountQuery().andWhere(
      'e.id = :id',
      { id },
    );

    this.logger.debug(query.getSql());

    return await query.getOne();
  }

  public async createEvent(
    createEventDto: CreateEventDto,
    user: User,
  ): Promise<Event> {
    return this.eventRepository.save({
      ...createEventDto,
      organizer: user,
      when: new Date(createEventDto.when),
    });
  }

  public async updateEvent(id: number, input: UpdateEventDto, user: User) {
    const event = await this.eventRepository.findOneBy({ id });

    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException();
    }

    return await this.eventRepository.save({
      ...event,
      ...input,
      when: input.when ? new Date(input.when) : event.when,
    });
  }

  public async deleteEvent(id: number, user: User) {
    const event = await this.getEvent(id);

    if (!event) {
      throw new NotFoundException();
    }

    if (event.organizerId !== user.id) {
      throw new ForbiddenException();
    }

    const result = await this.eventRepository
      .createQueryBuilder('e')
      .delete()
      .where('id = :id', { id })
      .execute();

    return result;
  }
}
