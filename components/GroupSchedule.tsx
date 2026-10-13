"use client";

import { useMemo, useState } from "react";

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

type GroupScheduleProps = {
  members: Member[];
  busyBlocks: BusyBlock[];
  timezone: string;
};

type TimeRange = {
  start: Date;
  end: Date;
};

type DisplayBusyBlock = BusyBlock & {
  start: Date;
  end: Date;
};

const START_HOUR = 9;
const END_HOUR = 23;

function getTodayForDateInput() {
  const now = new Date();

  const localTime = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60_000,
  );

  return localTime.toISOString().slice(0, 10);
}

function formatTime(
  date: Date,
  timezone: string,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatHour(hour: number) {
  const date = new Date();

  date.setHours(hour, 0, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
  });
}

export default function GroupSchedule({
  members,
  busyBlocks,
  timezone,
}: GroupScheduleProps) {
  const [selectedDate, setSelectedDate] = useState(
    getTodayForDateInput(),
  );

  const [durationMinutes, setDurationMinutes] =
    useState(60);

  const schedule = useMemo(() => {
    if (!selectedDate) {
      return {
        dailyBusyBlocks: [],
        mergedBusy: [],
        freeTimes: [],
      };
    }

    // First version:
    // search from 9 AM until 11 PM.
    //
    // Because your profile timezone currently matches
    // your browser timezone, datetime-local works correctly
    // for our current version.
    const searchStart = new Date(
      `${selectedDate}T09:00:00`,
    );

    const searchEnd = new Date(
      `${selectedDate}T23:00:00`,
    );

    // -----------------------------------------------
    // Find every busy block that overlaps this date.
    // -----------------------------------------------

    const dailyBusyBlocks: DisplayBusyBlock[] =
      busyBlocks
        .map((block) => ({
          ...block,
          start: new Date(block.startsAt),
          end: new Date(block.endsAt),
        }))
        .filter(
          (block) =>
            block.start < searchEnd &&
            block.end > searchStart,
        );

    // -----------------------------------------------
    // Convert them into intervals and clip anything
    // extending outside our 9 AM–11 PM window.
    // -----------------------------------------------

    const intervals: TimeRange[] =
      dailyBusyBlocks
        .map((block) => ({
          start:
            block.start < searchStart
              ? searchStart
              : block.start,

          end:
            block.end > searchEnd
              ? searchEnd
              : block.end,
        }))
        .sort(
          (a, b) =>
            a.start.getTime() -
            b.start.getTime(),
        );

    // -----------------------------------------------
    // Merge overlapping intervals.
    // -----------------------------------------------

    const mergedBusy: TimeRange[] = [];

    for (const interval of intervals) {
      const last =
        mergedBusy[mergedBusy.length - 1];

      if (!last) {
        mergedBusy.push({
          start: interval.start,
          end: interval.end,
        });

        continue;
      }

      if (interval.start <= last.end) {
        if (interval.end > last.end) {
          last.end = interval.end;
        }
      } else {
        mergedBusy.push({
          start: interval.start,
          end: interval.end,
        });
      }
    }

    // -----------------------------------------------
    // Find the gaps between the merged busy periods.
    // -----------------------------------------------

    const freeTimes: TimeRange[] = [];

    let cursor = searchStart;

    for (const busy of mergedBusy) {
      if (busy.start > cursor) {
        freeTimes.push({
          start: cursor,
          end: busy.start,
        });
      }

      if (busy.end > cursor) {
        cursor = busy.end;
      }
    }

    if (cursor < searchEnd) {
      freeTimes.push({
        start: cursor,
        end: searchEnd,
      });
    }

    // -----------------------------------------------
    // Only keep free windows large enough for the
    // selected meeting duration.
    // -----------------------------------------------

    const minimumDurationMs =
      durationMinutes * 60 * 1000;

    const filteredFreeTimes =
      freeTimes.filter((range) => {
        const duration =
          range.end.getTime() -
          range.start.getTime();

        return duration >= minimumDurationMs;
      });

    return {
      searchStart,
      searchEnd,
      dailyBusyBlocks,
      mergedBusy,
      freeTimes: filteredFreeTimes,
    };
  }, [
    selectedDate,
    durationMinutes,
    busyBlocks,
  ]);

  const hourLabels = [];

  for (
    let hour = START_HOUR;
    hour <= END_HOUR;
    hour++
  ) {
    hourLabels.push(hour);
  }

  function getPosition(
    date: Date,
    searchStart: Date,
    searchEnd: Date,
  ) {
    const total =
      searchEnd.getTime() -
      searchStart.getTime();

    const elapsed =
      date.getTime() -
      searchStart.getTime();

    return (elapsed / total) * 100;
  }

  function getBlockStyle(
    start: Date,
    end: Date,
  ) {
    if (
      !schedule.searchStart ||
      !schedule.searchEnd
    ) {
      return {
        left: "0%",
        width: "0%",
      };
    }

    const clippedStart =
      start < schedule.searchStart
        ? schedule.searchStart
        : start;

    const clippedEnd =
      end > schedule.searchEnd
        ? schedule.searchEnd
        : end;

    const left = getPosition(
      clippedStart,
      schedule.searchStart,
      schedule.searchEnd,
    );

    const right = getPosition(
      clippedEnd,
      schedule.searchStart,
      schedule.searchEnd,
    );

    return {
      left: `${left}%`,
      width: `${right - left}%`,
    };
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Group schedule
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          See everyone&apos;s schedule and find
          times when the whole group is free.
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Times are shown in {timezone}.
        </p>
      </div>

      {/* SETTINGS */}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
            value={selectedDate}
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
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(
                Number(event.target.value),
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

      {/* VISUAL TIMELINE */}

      <div className="mt-10 overflow-x-auto">
        <div className="min-w-[850px]">

          {/* Hour labels */}

          <div className="ml-28 flex">
            {hourLabels.slice(0, -1).map(
              (hour) => (
                <div
                  key={hour}
                  className="flex-1 text-xs text-gray-500"
                >
                  {formatHour(hour)}
                </div>
              ),
            )}
          </div>

          {/* Member rows */}

          <div className="mt-3 space-y-3">
            {members.map((member) => {
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
                  <div className="w-28 shrink-0 pr-4 text-sm font-medium text-gray-900">
                    {member.displayName}
                  </div>

                  <div className="relative h-12 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                    {/* Vertical hour grid */}

                    <div className="absolute inset-0 flex">
                      {hourLabels
                        .slice(0, -1)
                        .map((hour) => (
                          <div
                            key={hour}
                            className="flex-1 border-r border-gray-200 last:border-r-0"
                          />
                        ))}
                    </div>

                    {/* Busy blocks */}

                    {memberBlocks.map(
                      (block) => (
                        <div
                          key={block.id}
                          className="absolute top-1 bottom-1 rounded-md bg-blue-600 px-2 text-xs font-medium text-white"
                          style={getBlockStyle(
                            block.start,
                            block.end,
                          )}
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
            })}
          </div>

          {/* Everyone free row */}

          <div className="mt-5 flex items-center">
            <div className="w-28 shrink-0 pr-4 text-sm font-semibold text-green-700">
              Everyone free
            </div>

            <div className="relative h-12 flex-1 overflow-hidden rounded-lg border border-green-200 bg-gray-50">

              <div className="absolute inset-0 flex">
                {hourLabels
                  .slice(0, -1)
                  .map((hour) => (
                    <div
                      key={hour}
                      className="flex-1 border-r border-gray-200 last:border-r-0"
                    />
                  ))}
              </div>

              {schedule.freeTimes.map(
                (range, index) => (
                  <div
                    key={`${range.start.toISOString()}-${index}`}
                    className="absolute top-1 bottom-1 rounded-md bg-green-200"
                    style={getBlockStyle(
                      range.start,
                      range.end,
                    )}
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

      {/* TEXT SUMMARY */}

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900">
          Available times
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Searching between 9:00 AM and
          11:00 PM.
        </p>

        {schedule.freeTimes.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="font-medium text-gray-900">
              No matching free times.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try a shorter duration or another
              date.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {schedule.freeTimes.map(
              (range, index) => (
                <div
                  key={`${range.end.toISOString()}-${index}`}
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
                    Everyone is available
                  </p>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}