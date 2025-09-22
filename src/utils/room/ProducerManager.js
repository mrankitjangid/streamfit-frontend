class ProducerManager {
    constructor(producerTransport, device, socket) {
        this.producerTransport = producerTransport;
        this.device = device;
        this.socket = socket;
        this.producers = new Map();
        this.producerLabel = new Map();
    }

    async produce(type) {
        try {
            let options = {}, stream;

            switch (type) {
                case 'video': {
                    stream = await this.getVideoStream();
                    options.track = stream.getVideoTracks()[0];

                    const vp8Codec = this.device?.rtpCapabilities?.codecs?.find(
                        c => c.mimeType.toLowerCase() === 'video/vp8'
                    );

                    if (vp8Codec) {
                        options.codec = vp8Codec;
                        options.encodings = [{ maxBitrate: 2_000_000 }];
                        options.codecOptions = { 'x-google-start-bitrate': 1000 };
                    } else {
                        options.encodings = [
                            { maxBitrate: 500_000, scaleResolutionDownBy: 4 },
                            { maxBitrate: 1_000_000, scaleResolutionDownBy: 2 },
                            { maxBitrate: 2_000_000, scaleResolutionDownBy: 1 }
                        ];
                    }
                    break;
                }

                case 'audio': {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });
                    options.track = stream.getAudioTracks()[0];
                    break;
                }

                case 'screen': {
                    stream = await navigator.mediaDevices.getDisplayMedia();
                    options.track = stream.getVideoTracks()[0];
                    options.codec = this.device?.rtpCapabilities?.codecs?.find(c => c.mimeType.toLowerCase() === 'video/vp8');
                    options.codecOptions = {
                        'x-google-start-bitrate': 1000
                    }
                    break;
                }

                default:
                    throw new Error(`Unsupported media type: ${type}`);
            }

            console.log('Creating producer with options:', options);
            console.log('Producer transport state:', this.producerTransport.connectionState);

            const producer = await this.producerTransport.produce(options);

            this.producers.set(producer.id, producer);
            this.producerLabel.set(type, producer.id);

            return { producer, stream };
        } catch (err) {
            console.error('Error producing:', err);
            throw err;
        }
    }

    async getVideoStream() {
        const constraints = [
            {
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            },
            {
                video: {
                    width: { ideal: 640, min: 320 },
                    height: { ideal: 480, min: 240 },
                    frameRate: { ideal: 24, min: 15 }
                }
            },
            {
                video: {
                    width: { ideal: 320, min: 160 },
                    height: { ideal: 240, min: 120 },
                    frameRate: { ideal: 15, min: 10 }
                }
            }
        ];

        let lastError;

        for (const constraint of constraints) {
            try {
                console.log('Attempting video constraints:', constraint);
                const stream = await navigator.mediaDevices.getUserMedia(constraint);

                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack) {
                    throw new Error('No video track available');
                }

                console.log('Successfully got video stream with constraints:', constraint);
                return stream;
            } catch (error) {
                console.warn('Failed with constraints:', constraint, 'Error:', error);
                lastError = error;

                if (constraint === constraints[constraints.length - 1]) {
                    throw new Error(`Failed to get video stream: ${lastError.message}`);
                }
            }
        }

        throw lastError;
    }

    closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('No producer for type:', type);
            return;
        }

        const producer_id = this.producerLabel.get(type);

        this.socket.emit('producerClosed', {
            producer_id
        });

        this.producers.get(producer_id).close();
        this.producers.delete(producer_id);
        this.producerLabel.delete(type);

        return producer_id;
    }

    getProducer(type) {
        const producer_id = this.producerLabel.get(type);
        return this.producers.get(producer_id);
    }

    getAllProducers() {
        return this.producers;
    }
}

export default ProducerManager;
