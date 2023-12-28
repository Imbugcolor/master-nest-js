export class ListEvents {
  when?: WhenEventsFilter = WhenEventsFilter.All;
  page?: number = 1;
}

export enum WhenEventsFilter {
  All = 1,
  Today,
  Tommorow,
  ThisWeek,
  NextWeek,
}
