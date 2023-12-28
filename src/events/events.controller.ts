import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateEventDto } from './input/create-event.dto';
import { UpdateEventDto } from './input/update-event.dto';
import { EventsService } from './events.service';
import { ListEvents } from './input/list.events';
import { JwtAuthGuard } from 'src/auth/jwtAuth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/auth/user.entity';

@Controller('/events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filter: ListEvents) {
    this.logger.log(filter);
    const events =
      await this.eventsService.getEventsWithAttendeeCountQueryFilteredPaginated(
        filter,
        { total: true, currentPage: filter.page, limit: 2 },
      );
    return events;
  }

  // @Get('practice2')
  // async practice2() {
  //   // return await this.repository.findOne({
  //   //   where: {
  //   //     id: 1
  //   //   },
  //   //   relations: ['attendees']
  //   // })
  //   const event = await this.repository.findOne({
  //     where: {
  //       id: 1,
  //     },
  //     relations: ['attendees'],
  //   });
  //   const attendee = new Attendee();
  //   attendee.name = 'Using cascade';
  //   // attendee.event = event;
  //   // event.attendees.push(attendee);
  //   event.attendees = [];

  //   await this.repository.save(event);

  //   return event;
  // }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // console.log(typeof id);
    const event = await this.eventsService.getEvent(id);

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() input: CreateEventDto, @CurrentUser() user: User) {
    return await this.eventsService.createEvent(input, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: UpdateEventDto,
    @CurrentUser() user: User,
  ) {
    return this.eventsService.updateEvent(id, input, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return await this.eventsService.deleteEvent(id, user);
  }
}
