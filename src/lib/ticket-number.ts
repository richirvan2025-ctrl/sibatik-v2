export function ticketSequence(ticketNumber: string, prefix: string) {
  if (!ticketNumber.startsWith(prefix)) return 0;
  const value = Number.parseInt(ticketNumber.slice(prefix.length), 10);
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

export function nextTicketSequence(
  ticketNumbers: readonly string[],
  prefix: string
) {
  return (
    ticketNumbers.reduce(
      (highest, ticketNumber) =>
        Math.max(highest, ticketSequence(ticketNumber, prefix)),
      0
    ) + 1
  );
}
