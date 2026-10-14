type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getPartsInTimeZone(
  date: Date,
  timeZone: string,
): DateTimeParts {
  const formatter =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

  const parts =
    formatter.formatToParts(date);

  const values =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !== "literal",
        )
        .map((part) => [
          part.type,
          part.value,
        ]),
    );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function utcToLocalInput(
  value: string | Date,
  timeZone: string,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const parts =
    getPartsInTimeZone(
      date,
      timeZone,
    );

  return (
    `${parts.year}-` +
    `${pad(parts.month)}-` +
    `${pad(parts.day)}T` +
    `${pad(parts.hour)}:` +
    `${pad(parts.minute)}`
  );
}

export function localInputToUtcIso(
  value: string,
  timeZone: string,
) {
  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
    );

  if (!match) {
    throw new Error(
      "Please enter a valid date and time.",
    );
  }

  const requested = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: 0,
  };

  const requestedAsUtc =
    Date.UTC(
      requested.year,
      requested.month - 1,
      requested.day,
      requested.hour,
      requested.minute,
      0,
    );

  let guess =
    new Date(requestedAsUtc);

  /*
   * The HTML datetime-local control has no timezone.
   *
   * We repeatedly compare what the current guess looks
   * like in the user's saved timezone with the time the
   * user actually entered.
   */
  for (
    let attempt = 0;
    attempt < 4;
    attempt++
  ) {
    const actual =
      getPartsInTimeZone(
        guess,
        timeZone,
      );

    const actualAsUtc =
      Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
        0,
      );

    const difference =
      requestedAsUtc -
      actualAsUtc;

    if (difference === 0) {
      break;
    }

    guess =
      new Date(
        guess.getTime() +
          difference,
      );
  }

  const finalParts =
    getPartsInTimeZone(
      guess,
      timeZone,
    );

  const matches =
    finalParts.year ===
      requested.year &&
    finalParts.month ===
      requested.month &&
    finalParts.day ===
      requested.day &&
    finalParts.hour ===
      requested.hour &&
    finalParts.minute ===
      requested.minute;

  /*
   * This can happen during the DST spring-forward gap,
   * such as trying to choose a local time that never
   * actually occurred.
   */
  if (!matches) {
    throw new Error(
      `That time does not exist in ${timeZone}. Please choose another time.`,
    );
  }

  return guess.toISOString();
}