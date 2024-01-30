import { EventType } from "@liftedinit/many-js"
import { bufferToNumber } from "./buffer-utils"

// Extract block height and event number from the event ID
export const extractEventDetails = (
  eventId: ArrayBuffer,
  eventType: EventType,
) => {
  const bufferLength = eventId.byteLength
  if (bufferLength < 4) {
    throw new Error("Event ID buffer length too short!")
  }
  const eventHeightBuf = eventId.slice(0, bufferLength - 4)
  const eventNumberBuf = eventId.slice(bufferLength - 4)

  const blockHeight = bufferToNumber(new Uint8Array(eventHeightBuf)) + 2
  let eventNumber = bufferToNumber(new Uint8Array(eventNumberBuf))

  if (eventType === EventType.accountMultisigSubmit) {
    eventNumber = eventNumber - 1
  }

  return { blockHeight, eventNumber }
}