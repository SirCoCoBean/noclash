"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import EventActions from "@/components/EventActions";
import ScheduleEventButton from "@/components/ScheduleEventButton";

type Member = {
  userId: string;
  displayName: string;
};

type BusyBlock = {
  id: string;
  userId: string;
  startsAt: string;
  endsAt: string;
};

type GroupEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  canManage: boolean;
};

type GroupScheduleProps = {
  groupId: string;
  members: Member[];
  busyBlocks: BusyBlock[];
  events: GroupEvent[];
  timezone: string;
};

type TimeRange = {
  start: Date;
  end: Date;
};

type DisplayBusyBlock =
  BusyBlock & {
    start: Date;
    end: Date;
  };

type DisplayEvent =
  GroupEvent & {
    start: Date;
    end: Date;
  };

type DaySchedule = {
  searchStart: Date;
  searchEnd: Date;
  dailyBusyBlocks: DisplayBusyBlock[];
  dailyEvents: DisplayEvent[];
  freeTimes: TimeRange[];
};

type MultiDayResult = {
  date: string;
  freeTimes: TimeRange[];
};

const START_HOUR = 9;
const END_HOUR = 23;

const MAX_SEARCH_DAYS = 31;

// ======================================================
// TIME HELPERS
// ======================================================

function getTimeZoneParts(
  date: Date,
  timezone: string,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      },
    );

  const parts =
    formatter.formatToParts(date);

  const values:
    Record<string, string> = {};

  for (const part of parts) {
    if (
      part.type !== "literal"
    ) {
      values[part.type] =
        part.value;
    }
  }

  return {
    year:
      Number(values.year),

    month:
      Number(values.month),

    day:
      Number(values.day),

    hour:
      Number(values.hour),

    minute:
      Number(values.minute),

    second:
      Number(values.second),
  };
}

function dateAtTimeInZone(
  dateString: string,
  hour: number,
  minute: number,
  timezone: string,
) {
  const [
    year,
    month,
    day,
  ] =
    dateString
      .split("-")
      .map(Number);

  const desiredTime =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
    );

  let guess =
    desiredTime;

  for (
    let attempt = 0;
    attempt < 3;
    attempt++
  ) {
    const parts =
      getTimeZoneParts(
        new Date(guess),
        timezone,
      );

    const actualTime =
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      );

    const difference =
      desiredTime -
      actualTime;

    guess +=
      difference;

    if (
      Math.abs(difference) <
      1000
    ) {
      break;
    }
  }

  return new Date(guess);
}

function getDateStringInTimeZone(
  date: Date,
  timezone: string,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(date);

  let year = "";
  let month = "";
  let day = "";

  for (const part of parts) {
    if (part.type === "year") {
      year = part.value;
    }

    if (part.type === "month") {
      month = part.value;
    }

    if (part.type === "day") {
      day = part.value;
    }
  }

  return `${year}-${month}-${day}`;
}

function addDays(
  dateString: string,
  numberOfDays: number,
) {
  const [
    year,
    month,
    day,
  ] =
    dateString
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day + numberOfDays,
      ),
    );

  return date
    .toISOString()
    .slice(0, 10);
}

function getDaysBetween(
  startDate: string,
  endDate: string,
) {
  const start =
    new Date(
      `${startDate}T00:00:00Z`,
    );

  const end =
    new Date(
      `${endDate}T00:00:00Z`,
    );

  return (
    Math.floor(
      (
        end.getTime() -
        start.getTime()
      ) /
        (
          24 *
          60 *
          60 *
          1000
        ),
    ) + 1
  );
}

function formatDateLabel(
  dateString: string,
) {
  const [
    year,
    month,
    day,
  ] =
    dateString
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
      ),
    );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        "UTC",

      weekday:
        "long",

      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",
    },
  ).format(date);
}

function formatTime(
  date: Date,
  timezone: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone:
        timezone,

      hour:
        "numeric",

      minute:
        "2-digit",
    },
  ).format(date);
}

function formatHour(
  hour: number,
) {
  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${displayHour} ${suffix}`;
}

// ======================================================
// SCHEDULING ALGORITHM
// ======================================================

function calculateDaySchedule(
  dateString: string,
  minimumMinutes: number,
  busyBlocks: BusyBlock[],
  events: GroupEvent[],
  timezone: string,
): DaySchedule {
  const searchStart =
    dateAtTimeInZone(
      dateString,
      START_HOUR,
      0,
      timezone,
    );

  const searchEnd =
    dateAtTimeInZone(
      dateString,
      END_HOUR,
      0,
      timezone,
    );

  const dailyBusyBlocks:
    DisplayBusyBlock[] =
    busyBlocks
      .map((block) => ({
        ...block,

        start:
          new Date(
            block.startsAt,
          ),

        end:
          new Date(
            block.endsAt,
          ),
      }))
      .filter(
        (block) =>
          block.start <
            searchEnd &&
          block.end >
            searchStart,
      );

  const dailyEvents:
    DisplayEvent[] =
    events
      .map((event) => ({
        ...event,

        start:
          new Date(
            event.startsAt,
          ),

        end:
          new Date(
            event.endsAt,
          ),
      }))
      .filter(
        (event) =>
          event.start <
            searchEnd &&
          event.end >
            searchStart,
      );

  const intervals:
    TimeRange[] = [
      ...dailyBusyBlocks.map(
        (block) => ({
          start:
            block.start <
            searchStart
              ? searchStart
              : block.start,

          end:
            block.end >
            searchEnd
              ? searchEnd
              : block.end,
        }),
      ),

      ...dailyEvents.map(
        (event) => ({
          start:
            event.start <
            searchStart
              ? searchStart
              : event.start,

          end:
            event.end >
            searchEnd
              ? searchEnd
              : event.end,
        }),
      ),
    ].sort(
      (a, b) =>
        a.start.getTime() -
        b.start.getTime(),
    );

  const mergedBusy:
    TimeRange[] = [];

  for (
    const interval
    of intervals
  ) {
    const last =
      mergedBusy[
        mergedBusy.length - 1
      ];

    if (!last) {
      mergedBusy.push({
        start:
          interval.start,

        end:
          interval.end,
      });

      continue;
    }

    if (
      interval.start <=
      last.end
    ) {
      if (
        interval.end >
        last.end
      ) {
        last.end =
          interval.end;
      }
    } else {
      mergedBusy.push({
        start:
          interval.start,

        end:
          interval.end,
      });
    }
  }

  const freeTimes:
    TimeRange[] = [];

  let cursor =
    searchStart;

  for (
    const busy
    of mergedBusy
  ) {
    if (
      busy.start >
      cursor
    ) {
      freeTimes.push({
        start:
          cursor,

        end:
          busy.start,
      });
    }

    if (
      busy.end >
      cursor
    ) {
      cursor =
        busy.end;
    }
  }

  if (
    cursor <
    searchEnd
  ) {
    freeTimes.push({
      start:
        cursor,

      end:
        searchEnd,
    });
  }

  const minimumDurationMs =
    minimumMinutes *
    60 *
    1000;

  const filteredFreeTimes =
    freeTimes.filter(
      (range) =>
        range.end.getTime() -
          range.start.getTime() >=
        minimumDurationMs,
    );

  return {
    searchStart,
    searchEnd,
    dailyBusyBlocks,
    dailyEvents,
    freeTimes:
      filteredFreeTimes,
  };
}

// ======================================================
// COMPONENT
// ======================================================

export default function GroupSchedule({
  groupId,
  members,
  busyBlocks,
  events,
  timezone,
}: GroupScheduleProps) {
  const today =
    getDateStringInTimeZone(
      new Date(),
      timezone,
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(today);

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState(60);

  const [
    rangeStart,
    setRangeStart,
  ] = useState(today);

  const [
    rangeEnd,
    setRangeEnd,
  ] = useState(
    addDays(
      today,
      6,
    ),
  );

  const [
    rangeDuration,
    setRangeDuration,
  ] = useState(120);

  const [
    multiDayResults,
    setMultiDayResults,
  ] =
    useState<
      MultiDayResult[] | null
    >(null);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  useEffect(() => {
    setMultiDayResults(
      null,
    );

    setSearchError("");
  }, [
    busyBlocks,
    events,
  ]);

  const schedule =
    useMemo(
      () =>
        calculateDaySchedule(
          selectedDate,
          durationMinutes,
          busyBlocks,
          events,
          timezone,
        ),

      [
        selectedDate,
        durationMinutes,
        busyBlocks,
        events,
        timezone,
      ],
    );

  function findMultiDayTimes() {
    setSearchError("");

    if (
      !rangeStart ||
      !rangeEnd
    ) {
      setSearchError(
        "Please choose both a start and end date.",
      );

      return;
    }

    if (
      rangeEnd <
      rangeStart
    ) {
      setSearchError(
        "The end date must be after the start date.",
      );

      return;
    }

    const numberOfDays =
      getDaysBetween(
        rangeStart,
        rangeEnd,
      );

    if (
      numberOfDays >
      MAX_SEARCH_DAYS
    ) {
      setSearchError(
        `Please search ${MAX_SEARCH_DAYS} days or fewer at a time.`,
      );

      return;
    }

    const results:
      MultiDayResult[] = [];

    for (
      let index = 0;
      index <
      numberOfDays;
      index++
    ) {
      const date =
        addDays(
          rangeStart,
          index,
        );

      const result =
        calculateDaySchedule(
          date,
          rangeDuration,
          busyBlocks,
          events,
          timezone,
        );

      if (
        result.freeTimes.length >
        0
      ) {
        results.push({
          date,

          freeTimes:
            result.freeTimes,
        });
      }
    }

    setMultiDayResults(
      results,
    );
  }

  const hourLabels:
    number[] = [];

  for (
    let hour =
      START_HOUR;
    hour <= END_HOUR;
    hour++
  ) {
    hourLabels.push(
      hour,
    );
  }

  function getPosition(
    date: Date,
  ) {
    const total =
      schedule.searchEnd.getTime() -
      schedule.searchStart.getTime();

    const elapsed =
      date.getTime() -
      schedule.searchStart.getTime();

    return (
      (elapsed / total) *
      100
    );
  }

  function getBlockStyle(
    start: Date,
    end: Date,
  ) {
    const clippedStart =
      start <
      schedule.searchStart
        ? schedule.searchStart
        : start;

    const clippedEnd =
      end >
      schedule.searchEnd
        ? schedule.searchEnd
        : end;

    const left =
      getPosition(
        clippedStart,
      );

    const right =
      getPosition(
        clippedEnd,
      );

    return {
      left:
        `${left}%`,

      width:
        `${right - left}%`,
    };
  }

  return (
    <div className="sakura-card overflow-hidden">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="border-b border-[#b9687d]/10 bg-white/35 p-6 sm:p-8">

        <p className="sakura-label">
          Find your moment
        </p>

        <h2 className="sakura-title mt-2 text-3xl font-semibold">
          Group schedule
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#74676d]">
          Compare everyone&apos;s availability and find
          a quiet opening that works for the whole group.
        </p>

        <p className="mt-1 text-xs text-[#9d8e93]">
          Times shown in {timezone}
        </p>

      </div>

      <div className="p-6 sm:p-8">

        {/* ================================================= */}
        {/* DAILY CONTROLS */}
        {/* ================================================= */}

        <div>

          <h3 className="sakura-title text-2xl font-semibold">
            Daily schedule
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div>
              <label
                htmlFor="scheduleDate"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Date
              </label>

              <input
                id="scheduleDate"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Minimum free time
              </label>

              <select
                id="duration"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              >
                <option value={30}>
                  30 minutes
                </option>

                <option value={60}>
                  1 hour
                </option>

                <option value={90}>
                  1.5 hours
                </option>

                <option value={120}>
                  2 hours
                </option>

                <option value={180}>
                  3 hours
                </option>
              </select>
            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* TIMELINE */}
        {/* ================================================= */}

        <div className="mt-10 overflow-x-auto rounded-2xl border border-[#b9687d]/10 bg-white/45 p-5">

          <div className="min-w-[850px]">

            <div className="ml-28 flex">

              {hourLabels
                .slice(
                  0,
                  -1,
                )
                .map(
                  (hour) => (
                    <div
                      key={hour}
                      className="flex-1 text-xs text-[#9d8e93]"
                    >
                      {formatHour(
                        hour,
                      )}
                    </div>
                  ),
                )}

            </div>

            {/* MEMBERS */}

            <div className="mt-4 space-y-3">

              {members.map(
                (member) => {
                  const memberBlocks =
                    schedule.dailyBusyBlocks.filter(
                      (block) =>
                        block.userId ===
                        member.userId,
                    );

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center"
                    >
                      <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-[#51474b]">
                        {member.displayName}
                      </div>

                      <div className="relative h-12 flex-1 overflow-hidden rounded-xl border border-[#b9687d]/10 bg-[#fffaf9]">

                        <div className="absolute inset-0 flex">

                          {hourLabels
                            .slice(
                              0,
                              -1,
                            )
                            .map(
                              (hour) => (
                                <div
                                  key={hour}
                                  className="flex-1 border-r border-[#b9687d]/10 last:border-r-0"
                                />
                              ),
                            )}

                        </div>

                        {memberBlocks.map(
                          (block) => (
                            <div
                              key={block.id}
                              className="schedule-busy absolute bottom-1.5 top-1.5 rounded-lg px-2 text-xs font-semibold text-white shadow-sm"
                              style={
                                getBlockStyle(
                                  block.start,
                                  block.end,
                                )
                              }
                              title={`${formatTime(
                                block.start,
                                timezone,
                              )} – ${formatTime(
                                block.end,
                                timezone,
                              )}`}
                            >
                              <span className="flex h-full items-center overflow-hidden whitespace-nowrap">
                                Busy
                              </span>
                            </div>
                          ),
                        )}

                      </div>
                    </div>
                  );
                },
              )}

            </div>

            {/* EVENTS */}

            <div className="mt-5 flex items-center">

              <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-[#725576]">
                Events
              </div>

              <div className="relative h-12 flex-1 overflow-hidden rounded-xl border border-[#86678a]/15 bg-[#fffaf9]">

                <div className="absolute inset-0 flex">

                  {hourLabels
                    .slice(
                      0,
                      -1,
                    )
                    .map(
                      (hour) => (
                        <div
                          key={hour}
                          className="flex-1 border-r border-[#86678a]/10 last:border-r-0"
                        />
                      ),
                    )}

                </div>

                {schedule.dailyEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="schedule-event absolute bottom-1.5 top-1.5 rounded-lg px-2 text-xs font-semibold text-white shadow-sm"
                      style={
                        getBlockStyle(
                          event.start,
                          event.end,
                        )
                      }
                      title={`${event.title}: ${formatTime(
                        event.start,
                        timezone,
                      )} – ${formatTime(
                        event.end,
                        timezone,
                      )}`}
                    >
                      <span className="flex h-full items-center overflow-hidden whitespace-nowrap">
                        {event.title}
                      </span>
                    </div>
                  ),
                )}

              </div>

            </div>

            {/* FREE */}

            <div className="mt-5 flex items-center">

              <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-[#718067]">
                Everyone free
              </div>

              <div className="relative h-12 flex-1 overflow-hidden rounded-xl border border-[#a9b59f]/25 bg-[#fffaf9]">

                <div className="absolute inset-0 flex">

                  {hourLabels
                    .slice(
                      0,
                      -1,
                    )
                    .map(
                      (hour) => (
                        <div
                          key={hour}
                          className="flex-1 border-r border-[#a9b59f]/15 last:border-r-0"
                        />
                      ),
                    )}

                </div>

                {schedule.freeTimes.map(
                  (
                    range,
                    index,
                  ) => (
                    <div
                      key={`${range.start.toISOString()}-${index}`}
                      className="schedule-free absolute bottom-1.5 top-1.5 rounded-lg"
                      style={
                        getBlockStyle(
                          range.start,
                          range.end,
                        )
                      }
                      title={`${formatTime(
                        range.start,
                        timezone,
                      )} – ${formatTime(
                        range.end,
                        timezone,
                      )}`}
                    />
                  ),
                )}

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* EVENTS */}
        {/* ================================================= */}

        <section className="mt-10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eee6ef] text-[#725576]">
              ✦
            </div>

            <div>
              <h3 className="sakura-title text-xl font-semibold">
                Scheduled events
              </h3>

              <p className="text-sm text-[#8c7c82]">
                Plans already made for this day.
              </p>
            </div>

          </div>

          {schedule.dailyEvents.length ===
          0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#86678a]/20 bg-[#f9f5fa]/55 p-6 text-center">

              <p className="text-sm text-[#8c7c82]">
                No group events on this date.
              </p>

            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {schedule.dailyEvents.map(
                (event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[#86678a]/15 bg-[#f8f3f9]/75 p-5"
                  >
                    <p className="sakura-title text-lg font-semibold text-[#67506b]">
                      {event.title}
                    </p>

                    <p className="mt-1 text-sm text-[#826786]">
                      {formatTime(
                        event.start,
                        timezone,
                      )}

                      {" – "}

                      {formatTime(
                        event.end,
                        timezone,
                      )}
                    </p>

                    {event.canManage && (
                      <EventActions
                        eventId={event.id}
                        title={event.title}
                        startsAt={event.startsAt}
                        endsAt={event.endsAt}
                        timezone={timezone}
                      />
                    )}

                  </div>
                ),
              )}

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* AVAILABLE */}
        {/* ================================================= */}

        <section className="mt-10">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6ebdf] text-[#718067]">
              ✓
            </div>

            <div>
              <h3 className="sakura-title text-xl font-semibold">
                Available times
              </h3>

              <p className="text-sm text-[#8c7c82]">
                Searching between 9:00 AM and 11:00 PM.
              </p>
            </div>

          </div>

          {schedule.freeTimes.length ===
          0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#a9b59f]/30 bg-[#f5f7f2]/55 p-7 text-center">

              <p className="font-semibold text-[#4b5546]">
                No matching free times
              </p>

              <p className="mt-2 text-sm text-[#8d9987]">
                Try a shorter duration or another date.
              </p>

            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {schedule.freeTimes.map(
                (
                  range,
                  index,
                ) => (
                  <div
                    key={`${range.end.toISOString()}-${index}`}
                    className="rounded-2xl border border-[#a9b59f]/25 bg-[#f5f7f2]/70 p-5"
                  >
                    <p className="sakura-title text-lg font-semibold text-[#4b5546]">
                      {formatTime(
                        range.start,
                        timezone,
                      )}

                      {" – "}

                      {formatTime(
                        range.end,
                        timezone,
                      )}
                    </p>

                    <p className="mt-1 text-sm text-[#718067]">
                      Everyone is available
                    </p>

                    <ScheduleEventButton
                      groupId={groupId}
                      slotStart={range.start}
                      slotEnd={range.end}
                      timezone={timezone}
                    />

                  </div>
                ),
              )}

            </div>
          )}

        </section>

        {/* ================================================= */}
        {/* MULTI DAY */}
        {/* ================================================= */}

        <section className="mt-12 border-t border-[#b9687d]/10 pt-10">

          <div className="max-w-2xl">

            <p className="sakura-label">
              Look ahead
            </p>

            <h3 className="sakura-title mt-2 text-2xl font-semibold">
              Find a time across multiple days
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#74676d]">
              Search a date range and let NoClash find
              every day with enough shared free time.
            </p>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div>
              <label
                htmlFor="rangeStart"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                From
              </label>

              <input
                id="rangeStart"
                type="date"
                value={rangeStart}
                onChange={(event) =>
                  setRangeStart(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="rangeEnd"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                To
              </label>

              <input
                id="rangeEnd"
                type="date"
                value={rangeEnd}
                onChange={(event) =>
                  setRangeEnd(
                    event.target.value,
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              />
            </div>

            <div>
              <label
                htmlFor="rangeDuration"
                className="block text-sm font-semibold text-[#5f5358]"
              >
                Need at least
              </label>

              <select
                id="rangeDuration"
                value={rangeDuration}
                onChange={(event) =>
                  setRangeDuration(
                    Number(
                      event.target.value,
                    ),
                  )
                }
                className="sakura-input mt-2 px-4 py-3"
              >
                <option value={30}>
                  30 minutes
                </option>

                <option value={60}>
                  1 hour
                </option>

                <option value={90}>
                  1.5 hours
                </option>

                <option value={120}>
                  2 hours
                </option>

                <option value={180}>
                  3 hours
                </option>

                <option value={240}>
                  4 hours
                </option>
              </select>
            </div>

          </div>

          <p className="mt-3 text-xs text-[#9d8e93]">
            Searches 9:00 AM–11:00 PM each day, up to
            31 days at once.
          </p>

          {searchError && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {searchError}
            </p>
          )}

          <button
            type="button"
            onClick={findMultiDayTimes}
            className="sakura-button mt-5 px-6 py-3"
          >
            Find Times
          </button>

          {multiDayResults !==
            null && (
            <div className="mt-8">

              {multiDayResults.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-[#a9b59f]/30 bg-[#f5f7f2]/55 p-8 text-center">

                  <p className="sakura-title text-lg font-semibold">
                    No matching times found
                  </p>

                  <p className="mt-2 text-sm text-[#8c7c82]">
                    Try a shorter duration or wider date
                    range.
                  </p>

                </div>
              ) : (
                <div className="space-y-5">

                  <div>
                    <h4 className="sakura-title text-xl font-semibold">
                      Best available times
                    </h4>

                    <p className="mt-1 text-sm text-[#8c7c82]">
                      Found availability on{" "}
                      {multiDayResults.length}{" "}
                      day
                      {multiDayResults.length ===
                      1
                        ? ""
                        : "s"}
                      .
                    </p>
                  </div>

                  {multiDayResults.map(
                    (dayResult) => (
                      <div
                        key={dayResult.date}
                        className="rounded-2xl border border-[#b9687d]/10 bg-white/45 p-5"
                      >

                        <h5 className="sakura-title text-lg font-semibold">
                          {formatDateLabel(
                            dayResult.date,
                          )}
                        </h5>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">

                          {dayResult.freeTimes.map(
                            (
                              range,
                              index,
                            ) => (
                              <div
                                key={`${range.start.toISOString()}-${index}`}
                                className="rounded-xl border border-[#a9b59f]/25 bg-[#f5f7f2]/75 p-4"
                              >
                                <p className="font-semibold text-[#4b5546]">
                                  {formatTime(
                                    range.start,
                                    timezone,
                                  )}

                                  {" – "}

                                  {formatTime(
                                    range.end,
                                    timezone,
                                  )}
                                </p>

                                <p className="mt-1 text-sm text-[#718067]">
                                  Everyone is available
                                </p>

                                <ScheduleEventButton
                                  groupId={groupId}
                                  slotStart={range.start}
                                  slotEnd={range.end}
                                  timezone={timezone}
                                />

                              </div>
                            ),
                          )}

                        </div>

                      </div>
                    ),
                  )}

                </div>
              )}

            </div>
          )}

        </section>

      </div>

    </div>
  );
}