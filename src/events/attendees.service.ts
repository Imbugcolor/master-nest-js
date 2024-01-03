import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendee } from './attendee.entity';
import { Repository } from 'typeorm';
import { CreateAttendeeDto } from './input/create-attendee.dto';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {}

  public async findByEventId(eventId: number): Promise<Attendee[]> {
    return this.attendeeRepository.find({ where: { event: { id: eventId } } });
  }

  public async findOneByEventIdAndUserId(
    eventId: number,
    userId: number,
  ): Promise<Attendee> {
    const attendee = await this.attendeeRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    if (!attendee) {
      throw new NotFoundException();
    }

    return attendee;
  }

  public async createOrUpdate(
    input: CreateAttendeeDto,
    eventId: number,
    userId: number,
  ): Promise<Attendee> {
    let attendee: Attendee;

    attendee = await this.attendeeRepository.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    if (!attendee) {
      attendee = new Attendee({ eventId, userId, answer: input.answer });
    } else {
      attendee.eventId = eventId;
      attendee.userId = userId;
      attendee.answer = input.answer;
      //Rest of input...
    }

    return await this.attendeeRepository.save(attendee);
  }
}
