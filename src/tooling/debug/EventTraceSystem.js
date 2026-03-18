export class EventTraceSystem {
    constructor(options = {}) {
        this.ui = options.ui || null;
        this.buffer = [];
        this.unsubscribe = null;
    }

    onAttach(context) {
        if (!this.ui) {
            this.ui = context?.scene?.getSystem?.('ui') || null;
        }

        this.ui?.addPanel?.('eventTracePanel', 20, 310, 360, {
            display: 'block',
            background: 'rgba(2, 6, 23, 0.82)',
            pointerEvents: 'none'
        });

        const engineEvents = context?.engine?.events;
        if (engineEvents?.onAny) {
            const listener = (eventName, ...args) => {
                const preview = JSON.stringify(args[0] ?? '').slice(0, 80);
                this.buffer.unshift(`${eventName}: ${preview}`);
                this.buffer = this.buffer.slice(0, 8);
                const panel = this.ui?.elements?.eventTracePanel;
                if (panel) {
                    panel.innerHTML = `<div style="font-weight:bold;margin-bottom:6px;">Event Trace</div>${this.buffer.map(item => `<div style="font-size:12px;opacity:0.9;">${item}</div>`).join('')}`;
                }
            };
            engineEvents.onAny(listener);
            this.unsubscribe = () => engineEvents.offAny(listener);
        }
    }

    onDetach() {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }
}
