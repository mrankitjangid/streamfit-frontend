class ConsumerManager {
    constructor(consumerTransport, device, socket) {
        this.device = device;
        this.consumerTransport = consumerTransport;
        this.socket = socket;
        this.consumers = new Map();
    }

    async consume(producer_id) {
        if (!this.consumerTransport) return;

        const { consumer, stream, kind } = await this.getConsumeStream(producer_id);

        this.consumers.set(producer_id, consumer);

        return { consumer, stream, kind };
    }

    async getConsumeStream(producerId) {
        const { rtpCapabilities } = this.device;
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id,
            producerId
        });
        const { id, kind, rtpParameters } = data;

        let codecOptions = {};

        // Fix for InvalidAccessError: setRemoteDescription failed

        const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });

        const stream = new MediaStream();
        stream.addTrack(consumer.track);

        return {
            consumer,
            stream,
            kind
        }
    }

    removeConsumer(producer_id) {
        const consumer = this.consumers.get(producer_id);
        if (consumer) {
            consumer.close();
            this.consumers.delete(producer_id);
        }
        return consumer;
    }

    getConsumer(producer_id) {
        return this.consumers.get(producer_id);
    }

    getAllConsumers() {
        return this.consumers;
    }
}

export default ConsumerManager;
