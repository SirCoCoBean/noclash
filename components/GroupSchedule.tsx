"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import EventActions from "@/components/EventActions";
import ScheduleEventButton from "@/components/ScheduleEventButton";


// ======================================================
// TYPES
// ======================================================

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


// ======================================================
// SCHEDULING HOURS
// ======================================================

const START_HOUR = 9;
const END_HOUR = 23;

const MAX_SEARCH_DAYS = 31;


// ======================================================
// TIMEZONE HELPERS
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


// Convert:
// October 14 + 9:00 AM + America/New_York
//
// into the real absolute JavaScript Date.
//
// This allows the scheduling algorithm to work
// with the user's saved timezone instead of
// assuming UTC.

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

  // Run a few adjustments so the generated
  // absolute Date corresponds to the desired
  // wall-clock time in the requested timezone.

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


// ======================================================
// DATE HELPERS
// ======================================================

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
    if (
      part.type === "year"
    ) {
      year = part.value;
    }

    if (
      part.type === "month"
    ) {
      month = part.value;
    }

    if (
      part.type === "day"
    ) {
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

  const milliseconds =
    end.getTime() -
    start.getTime();

  return (
    Math.floor(
      milliseconds /
        (24 * 60 * 60 * 1000),
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
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}


// ======================================================
// DISPLAY HELPERS
// ======================================================

function formatTime(
  date: Date,
  timezone: string,
) {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
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
// CORE NOCLASH ALGORITHM
// ======================================================

function calculateDaySchedule(
  dateString: string,
  minimumMinutes: number,
  busyBlocks: BusyBlock[],
  events: GroupEvent[],
  timezone: string,
): DaySchedule {
  // Search from:
  //
  // 9:00 AM → 11:00 PM

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


  // ====================================================
  // BUSY BLOCKS ON THIS DAY
  // ====================================================

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


  // ====================================================
  // EVENTS ON THIS DAY
  // ====================================================

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


  // ====================================================
  // CREATE ONE LIST OF BLOCKED INTERVALS
  // ====================================================

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


  // ====================================================
  // MERGE OVERLAPPING BLOCKED TIMES
  // ====================================================

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


  // ====================================================
  // FIND THE GAPS
  // ====================================================

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


  // ====================================================
  // REMOVE RESULTS THAT ARE TOO SHORT
  // ====================================================

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


  // ====================================================
  // DAILY VIEW STATE
  // ====================================================

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState(today);


  const [
    durationMinutes,
    setDurationMinutes,
  ] =
    useState(60);


  // ====================================================
  // MULTI-DAY SEARCH STATE
  // ====================================================

  const [
    rangeStart,
    setRangeStart,
  ] =
    useState(today);


  const [
    rangeEnd,
    setRangeEnd,
  ] =
    useState(
      addDays(
        today,
        6,
      ),
    );


  const [
    rangeDuration,
    setRangeDuration,
  ] =
    useState(120);


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
  ] =
    useState("");


  // If schedule data changes after an edit,
  // delete, or new event, clear old search results.

  useEffect(() => {
    setMultiDayResults(
      null,
    );

    setSearchError("");
  }, [
    busyBlocks,
    events,
  ]);


  // ====================================================
  // DAILY SCHEDULE
  // ====================================================

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


  // ====================================================
  // MULTI-DAY SEARCH
  // ====================================================

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


  // ====================================================
  // TIMELINE LABELS
  // ====================================================

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


  // ====================================================
  // TIMELINE POSITION HELPERS
  // ====================================================

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


  // ====================================================
  // UI
  // ====================================================

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Group schedule
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          See everyone&apos;s schedule and
          find times when the whole group
          is free.
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Times are shown in{" "}
          {timezone}.
        </p>
      </div>


      {/* ================================================= */}
      {/* DAILY VIEW CONTROLS */}
      {/* ================================================= */}

      <div className="mt-8">

        <h3 className="text-lg font-semibold text-gray-900">
          Daily schedule
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2">

          <div>
            <label
              htmlFor="scheduleDate"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>

            <input
              id="scheduleDate"
              type="date"
              value={
                selectedDate
              }
              onChange={(event) =>
                setSelectedDate(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
            />
          </div>


          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700"
            >
              Minimum free time
            </label>

            <select
              id="duration"
              value={
                durationMinutes
              }
              onChange={(event) =>
                setDurationMinutes(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
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
      {/* VISUAL TIMELINE */}
      {/* ================================================= */}

      <div className="mt-10 overflow-x-auto">

        <div className="min-w-[850px]">


          {/* HOURS */}

          <div className="ml-28 flex">

            {hourLabels
              .slice(
                0,
                -1,
              )
              .map(
                (hour) => (

                  <div
                    key={
                      hour
                    }
                    className="flex-1 text-xs text-gray-500"
                  >
                    {formatHour(
                      hour,
                    )}
                  </div>

                ),
              )}

          </div>


          {/* MEMBERS */}

          <div className="mt-3 space-y-3">

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
                    key={
                      member.userId
                    }
                    className="flex items-center"
                  >

                    <div className="w-28 shrink-0 pr-4 text-sm font-medium text-gray-900">
                      {
                        member.displayName
                      }
                    </div>


                    <div className="relative h-12 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">


                      <div className="absolute inset-0 flex">

                        {hourLabels
                          .slice(
                            0,
                            -1,
                          )
                          .map(
                            (hour) => (

                              <div
                                key={
                                  hour
                                }
                                className="flex-1 border-r border-gray-200 last:border-r-0"
                              />

                            ),
                          )}

                      </div>


                      {memberBlocks.map(
                        (block) => (

                          <div
                            key={
                              block.id
                            }
                            className="absolute bottom-1 top-1 rounded-md bg-blue-600 px-2 text-xs font-medium text-white"
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

            <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-purple-700">
              Events
            </div>


            <div className="relative h-12 flex-1 overflow-hidden rounded-lg border border-purple-200 bg-gray-50">


              <div className="absolute inset-0 flex">

                {hourLabels
                  .slice(
                    0,
                    -1,
                  )
                  .map(
                    (hour) => (

                      <div
                        key={
                          hour
                        }
                        className="flex-1 border-r border-gray-200 last:border-r-0"
                      />

                    ),
                  )}

              </div>


              {schedule.dailyEvents.map(
                (event) => (

                  <div
                    key={
                      event.id
                    }
                    className="absolute bottom-1 top-1 rounded-md bg-purple-600 px-2 text-xs font-medium text-white"
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
                      {
                        event.title
                      }
                    </span>

                  </div>

                ),
              )}

            </div>

          </div>


          {/* EVERYONE FREE */}

          <div className="mt-5 flex items-center">

            <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-green-700">
              Everyone free
            </div>


            <div className="relative h-12 flex-1 overflow-hidden rounded-lg border border-green-200 bg-gray-50">


              <div className="absolute inset-0 flex">

                {hourLabels
                  .slice(
                    0,
                    -1,
                  )
                  .map(
                    (hour) => (

                      <div
                        key={
                          hour
                        }
                        className="flex-1 border-r border-gray-200 last:border-r-0"
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
                    className="absolute bottom-1 top-1 rounded-md bg-green-200"
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
      {/* SCHEDULED EVENTS */}
      {/* ================================================= */}

      <div className="mt-10">

        <h3 className="text-lg font-semibold text-gray-900">
          Scheduled events
        </h3>


        {schedule.dailyEvents.length ===
        0 ? (

          <p className="mt-3 text-sm text-gray-500">
            No group events on this date.
          </p>

        ) : (

          <div className="mt-4 space-y-3">

            {schedule.dailyEvents.map(
              (event) => (

                <div
                  key={
                    event.id
                  }
                  className="rounded-lg border border-purple-200 bg-purple-50 p-4"
                >

                  <p className="font-semibold text-purple-900">
                    {
                      event.title
                    }
                  </p>


                  <p className="mt-1 text-sm text-purple-700">

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
                      eventId={
                        event.id
                      }
                      title={
                        event.title
                      }
                      startsAt={
                        event.startsAt
                      }
                      endsAt={
                        event.endsAt
                      }
                      timezone={
                        timezone
                      }
                    />

                  )}

                </div>

              ),
            )}

          </div>

        )}

      </div>


      {/* ================================================= */}
      {/* AVAILABLE TIMES FOR SELECTED DAY */}
      {/* ================================================= */}

      <div className="mt-10">

        <h3 className="text-lg font-semibold text-gray-900">
          Available times
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Searching between 9:00 AM and
          11:00 PM.
        </p>


        {schedule.freeTimes.length ===
        0 ? (

          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">

            <p className="font-medium text-gray-900">
              No matching free times.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try a shorter duration
              or another date.
            </p>

          </div>

        ) : (

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {schedule.freeTimes.map(
              (
                range,
                index,
              ) => (

                <div
                  key={`${range.end.toISOString()}-${index}`}
                  className="rounded-lg border border-green-200 bg-green-50 p-5"
                >

                  <p className="font-semibold text-green-900">

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


                  <p className="mt-1 text-sm text-green-700">
                    Everyone is available
                  </p>


                  <ScheduleEventButton
                    groupId={
                      groupId
                    }
                    slotStart={
                      range.start
                    }
                    slotEnd={
                      range.end
                    }
                    timezone={
                      timezone
                    }
                  />

                </div>

              ),
            )}

          </div>

        )}

      </div>


      {/* ================================================= */}
      {/* MULTI-DAY SEARCH */}
      {/* ================================================= */}

      <div className="mt-14 border-t border-gray-200 pt-10">

        <h3 className="text-2xl font-bold text-gray-900">
          Find a time across multiple days
        </h3>


        <p className="mt-2 text-sm text-gray-600">
          Choose a date range and NoClash
          will search every day for times
          when the entire group is free.
        </p>


        <div className="mt-6 grid gap-4 md:grid-cols-3">


          {/* FROM */}

          <div>

            <label
              htmlFor="rangeStart"
              className="block text-sm font-medium text-gray-700"
            >
              From
            </label>

            <input
              id="rangeStart"
              type="date"
              value={
                rangeStart
              }
              onChange={(event) =>
                setRangeStart(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
            />

          </div>


          {/* TO */}

          <div>

            <label
              htmlFor="rangeEnd"
              className="block text-sm font-medium text-gray-700"
            >
              To
            </label>

            <input
              id="rangeEnd"
              type="date"
              value={
                rangeEnd
              }
              onChange={(event) =>
                setRangeEnd(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
            />

          </div>


          {/* DURATION */}

          <div>

            <label
              htmlFor="rangeDuration"
              className="block text-sm font-medium text-gray-700"
            >
              Need at least
            </label>

            <select
              id="rangeDuration"
              value={
                rangeDuration
              }
              onChange={(event) =>
                setRangeDuration(
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900"
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


        <p className="mt-3 text-xs text-gray-500">
          NoClash searches between
          9:00 AM and 11:00 PM each day.
          You can search up to 31 days at
          once.
        </p>


        {searchError && (

          <p className="mt-4 text-sm text-red-600">
            {searchError}
          </p>

        )}


        <button
          type="button"
          onClick={
            findMultiDayTimes
          }
          className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Find Times
        </button>


        {/* =============================================== */}
        {/* MULTI-DAY RESULTS */}
        {/* =============================================== */}

        {multiDayResults !==
          null && (

          <div className="mt-8">


            {multiDayResults.length ===
            0 ? (

              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">

                <p className="font-semibold text-gray-900">
                  No matching times found.
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Try a shorter meeting
                  duration or a wider date
                  range.
                </p>

              </div>

            ) : (

              <div className="space-y-6">


                <div>

                  <h4 className="text-lg font-semibold text-gray-900">
                    Best available times
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    Found availability
                    on{" "}
                    {
                      multiDayResults.length
                    }{" "}
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
                      key={
                        dayResult.date
                      }
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >

                      <h5 className="text-lg font-semibold text-gray-900">
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
                              className="rounded-lg border border-green-200 bg-green-50 p-4"
                            >

                              <p className="font-semibold text-green-900">

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


                              <p className="mt-1 text-sm text-green-700">
                                Everyone is
                                available
                              </p>


                              <ScheduleEventButton
                                groupId={
                                  groupId
                                }
                                slotStart={
                                  range.start
                                }
                                slotEnd={
                                  range.end
                                }
                                timezone={
                                  timezone
                                }
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

      </div>

    </section>
  );
}