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

function getTodayForDateInput() {
  const now = new Date();

  const localTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60_000,
  );

  return localTime.toISOString().slice(0, 10);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
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
        freeTimes: [],
      };
    }

    // For our first version, search between
    // 9:00 AM and 11:00 PM.
    const searchStart = new Date(
      `${selectedDate}T09:00:00`,
    );

    const searchEnd = new Date(
      `${selectedDate}T23:00:00`,
    );

    // --------------------------------------------------
    // 1. Find every busy block overlapping this day.
    // --------------------------------------------------

    const dailyBusyBlocks = busyBlocks
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

    // --------------------------------------------------
    // 2. Convert everyone's busy blocks into intervals.
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 3. Merge overlapping busy intervals.
    //
    // Example:
    //
    // Tom:  5 PM ---- 7 PM
    // Alex:       6 PM ---- 8 PM
    //
    // becomes:
    //
    //       5 PM -------- 8 PM
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 4. Find the gaps between busy intervals.
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 5. Only show gaps long enough for the requested
    // meeting duration.
    // --------------------------------------------------

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
      dailyBusyBlocks,
      freeTimes: filteredFreeTimes,
    };
  }, [
    selectedDate,
    durationMinutes,
    busyBlocks,
  ]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Group schedule
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Find times when everyone in the group is
          available.
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Times are shown in {timezone}.
        </p>
      </div>

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
              setSelectedDate(event.target.value)
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

      {/* MEMBER BUSY TIMES */}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">
          Busy times
        </h3>

        {members.map((member) => {
          const memberBlocks =
            schedule.dailyBusyBlocks.filter(
              (block) =>
                block.userId === member.userId,
            );

          return (
            <div
              key={member.userId}
              className="mt-4 rounded-lg bg-gray-50 p-4"
            >
              <p className="font-medium text-gray-900">
                {member.displayName}
              </p>

              {memberBlocks.length === 0 ? (
                <p className="mt-1 text-sm text-gray-500">
                  No busy times on this date.
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {memberBlocks.map((block) => (
                    <p
                      key={block.id}
                      className="text-sm text-gray-600"
                    >
                      Busy{" "}
                      {formatTime(block.start)}
                      {" – "}
                      {formatTime(block.end)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* COMMON FREE TIMES */}

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900">
          Everyone is free
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
                  key={`${range.start.toISOString()}-${index}`}
                  className="rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <p className="font-semibold text-green-900">
                    {formatTime(range.start)}
                    {" – "}
                    {formatTime(range.end)}
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