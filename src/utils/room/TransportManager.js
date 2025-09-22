class TransportManager {
    constructor(device, socket) {
        this.device = device;
        this.socket = socket;
        this.producerTransport = null;
        this.consumerTransport = null;
    }

    async initTransports() {
        if (!this.device) {
            throw new Error('Device is not initialized in TransportManager');
        }
        // Initialize producer transport
        await this.initProducerTransport();

        // Initialize consumer transport
        await this.initConsumerTransport();
    }

    async initProducerTransport() {
        const data = await this.socket.request(
            'createWebRtcTransport', {
                rtpCapabilities: this.device.rtpCapabilities
            }
        );

        if (data?.error) {
            console.error(data.error);
            return;
        }

        this.producerTransport = this.device.createSendTransport(data);
        console.log('Producer transport created:', this.producerTransport);

        this.producerTransport.on(
            'connect',
            function({ dtlsParameters }, cb, eb) {
                console.log('producerTransport connect event', dtlsParameters);
                this.socket.request(
                    'connectTransport', {
                        transport_id: data.id,
                        dtlsParameters
                    }
                )
                .then(cb)
                .catch(eb);
            }.bind(this)
        );

        this.producerTransport.on(
            'produce',
            async function({ kind, rtpParameters }, cb, eb) {
                try {
                    const { producer_id } = await this.socket.request(
                        'produce', {
                            transport_id: this.producerTransport.id,
                            kind,
                            rtpParameters
                        }
                    );
                    cb({ id: producer_id });
                } catch (err) {
                    eb(err);
                }
            }.bind(this)
        );

        this.producerTransport.on(
            'connectionstatechange',
            function(state) {
                console.log('ProducerTransport state changed to', state);
                if (state === 'failed') {
                    this.producerTransport.close();
                }
            }.bind(this)
        );
    }

    async initConsumerTransport() {
        const data = await this.socket.request(
            'createWebRtcTransport', {
                forceTcp: false
            }
        );

        if (data?.error) {
            console.error(data.error);
            return;
        }

        this.consumerTransport = this.device.createRecvTransport(data);
        console.log('Consumer transport created:', this.consumerTransport);

        this.consumerTransport.on(
            'connect',
            function({ dtlsParameters }, cb, eb) {
                this.socket.request(
                    'connectTransport', {
                        transport_id: this.consumerTransport.id,
                        dtlsParameters
                    }
                )
                .then(cb)
                .catch(eb);
            }.bind(this)
        );

        this.consumerTransport.on(
            'connectionstatechange',
            function(state) {
                if (state === 'failed') {
                    this.consumerTransport.close();
                }
            }.bind(this)
        );
    }

    getProducerTransport() {
        return this.producerTransport;
    }

    getConsumerTransport() {
        return this.consumerTransport;
    }

    close() {
        if (this.producerTransport) {
            this.producerTransport.close();
        }
        if (this.consumerTransport) {
            this.consumerTransport.close();
        }
    }
}

export default TransportManager;
