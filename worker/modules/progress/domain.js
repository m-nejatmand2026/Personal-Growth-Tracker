const DATE =
  /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value) {
  if (
    !DATE.test(
      String(value || '')
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T12:00:00Z`
    );

  return (
    Number.isFinite(
      date.getTime()
    )
    && date
      .toISOString()
      .slice(0, 10)
      === value
  );
}

function cleanOptionalText(
  value,
  max
) {
  if (
    value == null
    || value === ''
  ) {
    return null;
  }

  const text =
    String(value)
      .trim();

  if (!text) {
    return null;
  }

  return text.length <= max
    ? text
    : undefined;
}

function nullableFiniteNumber(
  value
) {
  if (
    value == null
    || value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

export function normalizeProgressInput(
  body = {}
) {
  const activityKey =
    typeof body.activity_key
      === 'string'
      ? body.activity_key.trim()
      : '';

  if (!activityKey) {
    return {
      error:
        'Choose an Activity.'
    };
  }

  const occurredOn =
    body.occurred_on;

  if (
    !isRealDate(occurredOn)
  ) {
    return {
      error:
        'Choose a valid progress date.'
    };
  }

  const minutes =
    nullableFiniteNumber(
      body.minutes
    );

  if (
    minutes === undefined
    || (
      minutes != null
      && (
        !Number.isInteger(minutes)
        || minutes < 0
        || minutes > 1440
      )
    )
  ) {
    return {
      error:
        'Minutes must be an integer between 0 and 1440.'
    };
  }

  const quantity =
    nullableFiniteNumber(
      body.quantity
    );

  if (
    quantity === undefined
  ) {
    return {
      error:
        'Quantity must be a number.'
    };
  }

  let booleanValue = null;

  if (
    body.boolean_value !== undefined
    && body.boolean_value !== null
    && body.boolean_value !== ''
  ) {
    if (
      body.boolean_value === true
      || body.boolean_value === 1
      || body.boolean_value === '1'
    ) {
      booleanValue = 1;
    } else if (
      body.boolean_value === false
      || body.boolean_value === 0
      || body.boolean_value === '0'
    ) {
      booleanValue = 0;
    } else {
      return {
        error:
          'boolean_value must be true or false.'
      };
    }
  }

  if (
    minutes == null
    && quantity == null
    && booleanValue == null
  ) {
    return {
      error:
        'Record at least one factual measurement.'
    };
  }

  const subtype =
    cleanOptionalText(
      body.subtype,
      80
    );

  if (subtype === undefined) {
    return {
      error:
        'Subtype must be 80 characters or fewer.'
    };
  }

  const note =
    cleanOptionalText(
      body.note,
      500
    );

  if (note === undefined) {
    return {
      error:
        'Note must be 500 characters or fewer.'
    };
  }

  const startedAt =
    cleanOptionalText(
      body.started_at,
      40
    );

  if (
    startedAt === undefined
  ) {
    return {
      error:
        'started_at is too long.'
    };
  }

  return {
    value: {
      activity_key:
        activityKey,

      occurred_on:
        occurredOn,

      started_at:
        startedAt,

      minutes:
        minutes == null
          ? null
          : minutes,

      quantity:
        quantity == null
          ? null
          : quantity,

      boolean_value:
        booleanValue,

      subtype,
      note
    }
  };
}
