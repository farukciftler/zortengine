export type EventMap = Record<string, unknown>;

export type EventListener<TPayload> = (payload: TPayload) => void;
export type AnyEventListener<TEvents extends EventMap> = <TEventName extends keyof TEvents>(
    eventName: TEventName,
    payload: TEvents[TEventName]
) => void;

export interface EventBus<TEvents extends EventMap> {
    on<TEventName extends keyof TEvents>(eventName: TEventName, listener: EventListener<TEvents[TEventName]>): void;
    off<TEventName extends keyof TEvents>(eventName: TEventName, listener: EventListener<TEvents[TEventName]>): void;
    emit<TEventName extends keyof TEvents>(eventName: TEventName, payload: TEvents[TEventName]): void;
    onAny(listener: AnyEventListener<TEvents>): void;
    offAny(listener: AnyEventListener<TEvents>): void;
}
