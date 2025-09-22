import DeviceManager from './room/DeviceManager';
import TransportManager from './room/TransportManager';
import ProducerManager from './room/ProducerManager';
import ConsumerManager from './room/ConsumerManager';
import MediaElementManager from './room/MediaElementManager';
import SocketEventHandler from './room/SocketEventHandler';

class RoomClient {
    constructor(_room_id, _name, _socket, _mediasoupClient) {
        this.room_id = _room_id;
        this.name = _name;
        this.socket = _socket;
        this.mediasoupClient = _mediasoupClient;

        // Initialize managers
        this.deviceManager = new DeviceManager(this.mediasoupClient);
        this.device = null;
        this.transportManager = null;
        this.producerManager = null;
        this.consumerManager = null;
        this.mediaElementManager = new MediaElementManager();
        this.socketEventHandler = null;
    }

    async joinRoom() {
        try {
            console.log('Attempting to join room:', this.room_id);

            const response = await this.socket.request(
                'join-room',
                {
                    room_id: this.room_id,
                    name: this.name
                }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to join room');
            }

            console.log('Joined room successfully:', response);

            // Get router RTP capabilities
            let routerRtpCapabilities;
            try {
                routerRtpCapabilities = await this.socket.request('getRouterRtpCapabilities');
            } catch (error) {
                console.error('Failed to get router capabilities:', error);
                throw new Error('Failed to get router capabilities');
            }

            // Load device
            try {
                this.device = await this.deviceManager.loadDevice(routerRtpCapabilities);
                console.log('Device loaded successfully:', this.device);
            } catch (error) {
                console.error('Failed to load MediaSoup device:', error);
                throw new Error('Failed to load MediaSoup device');
            }

            // Initialize transports with the loaded device
            this.transportManager = new TransportManager(this.device, this.socket);

            try {
                await this.transportManager.initTransports();
                console.log('Transports initialized successfully');
            } catch (error) {
                console.error('Failed to initialize transports:', error);
                throw new Error('Failed to initialize transports');
            }

            // Initialize other managers with updated transports and device
            this.producerManager = new ProducerManager(this.transportManager.getProducerTransport(), this.device, this.socket);
            this.consumerManager = new ConsumerManager(this.transportManager.getConsumerTransport(), this.device, this.socket);
            this.socketEventHandler = new SocketEventHandler(this.socket, this.consumerManager, this.mediaElementManager);

            // Initialize socket event handlers
            this.socketEventHandler.initSockets();

            // Get producers
            try {
                this.socket.emit('getProducers');
            } catch (error) {
                console.warn('Failed to get producers, continuing anyway:', error);
            }

            console.log('Room joined successfully');
        } catch (err) {
            console.error('Room join error:', err);
            throw err;
        }
    }

    exit(offline = false) {
        const clean = () => {
            try {
                // Close transports
                this.transportManager.close();

                // Clean up socket event listeners
                if (this.socket) {
                    this.socket.off('disconnect');
                    this.socket.off('newProducers');
                    this.socket.off('consumerClosed');
                }
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        }

        if (!offline) {
            // Check if socket is available before trying to exit
            if (this.socket && this.socket.connected) {
                this.socket
                    .request('exit-room')
                    .then((e) => console.log('Exited room:', e))
                    .catch((e) => {
                        console.error('Error exiting room:', e);
                    })
                    .finally(() => clean());
            } else {
                console.log('Socket not available, cleaning up locally');
                clean();
            }
        } else {
            clean();
        }
    }

    async produce(type) {
        try {
            // Check if device is loaded
            if (!this.deviceManager.getDevice()) {
                console.error('Device not loaded:', {
                    device: this.deviceManager.getDevice(),
                    producerTransport: this.transportManager.getProducerTransport(),
                    consumerTransport: this.transportManager.getConsumerTransport()
                });
                throw new Error('MediaSoup device not loaded. Please refresh and try again.');
            }

            // Check if producer transport is available
            if (!this.transportManager.getProducerTransport()) {
                console.error('Producer transport not initialized:', {
                    device: this.deviceManager.getDevice(),
                    producerTransport: this.transportManager.getProducerTransport(),
                    consumerTransport: this.transportManager.getConsumerTransport()
                });
                throw new Error('Producer transport not initialized. Please refresh and try again.');
            }

            console.log('Creating producer with type:', type);
            console.log('Producer transport state:', this.transportManager.getProducerTransport().connectionState);

            const { producer, stream } = await this.producerManager.produce(type);

            const parent = document.getElementById('localMedia');
            let elem = this.mediaElementManager.createElement(type, stream, producer.id, parent);

            producer.on('trackended', () => {
                this.closeProducer(type);
            });

            producer.on('transportclose', () => {
                console.log('Producer transport closed');
                if (type !== 'audio') {
                    try {
                        elem.srcObject.getTracks().forEach(track => track.stop());
                        elem.parentNode.removeChild(elem);
                    } catch (error) {
                        console.error('Error cleaning up producer element:', error);
                    }
                }
                this.producerManager.producers.delete(producer.id);
            });

            producer.on('close', () => {
                console.log('Closing producer');
                if (type !== 'audio') {
                    try {
                        elem.srcObject.getTracks().forEach(track => track.stop());
                        elem.parentNode.removeChild(elem);
                    } catch (error) {
                        console.error('Error cleaning up producer element:', error);
                    }
                }
                this.producerManager.producers.delete(producer.id);
            });

            return { producer, stream, element: elem };
        } catch (err) {
            console.error('Error producing:', err);
            throw err;
        }
    }

    async consume(producer_id) {
        if (!this.transportManager.getConsumerTransport()) {
            console.warn('No consumer transport available');
            return;
        }

        try {
            const { consumer, stream, kind } = await this.consumerManager.consume(producer_id);

            const parent = document.getElementById('remoteMedia');
            this.mediaElementManager.createElement(kind, stream, producer_id, parent);

            consumer.on(
                'trackended',
                function() {
                    this.consumerManager.removeConsumer(producer_id);
                    this.mediaElementManager.removeConsumer(producer_id);
                }.bind(this)
            );

            consumer.on(
                'transportclose',
                function() {
                    this.consumerManager.removeConsumer(producer_id);
                    this.mediaElementManager.removeConsumer(producer_id);
                }.bind(this)
            );

            consumer.on(
                'producerclose',
                function() {
                    this.consumerManager.removeConsumer(producer_id);
                    this.mediaElementManager.removeConsumer(producer_id);
                }.bind(this)
            );

            return { consumer, stream, kind };
        } catch (error) {
            console.error('Error consuming producer:', producer_id, error);
            throw error;
        }
    }

    closeProducer(type) {
        const producer_id = this.producerManager.closeProducer(type);
        if (producer_id) {
            this.mediaElementManager.closeProducer(type, producer_id);
        }
    }

    removeConsumer(producer_id) {
        this.consumerManager.removeConsumer(producer_id);
        this.mediaElementManager.removeConsumer(producer_id);
    }

    async reconnect() {
        try {
            console.log('Attempting to reconnect...');

            // Clean up existing connections
            this.exit(true);

            // Reset managers
            this.deviceManager = new DeviceManager(this.mediasoupClient);
            this.transportManager = new TransportManager(this.deviceManager.getDevice(), this.socket);
            this.producerManager = new ProducerManager(this.transportManager.getProducerTransport(), this.deviceManager.getDevice(), this.socket);
            this.consumerManager = new ConsumerManager(this.transportManager.getConsumerTransport(), this.socket);
            this.mediaElementManager = new MediaElementManager();
            this.socketEventHandler = new SocketEventHandler(this.socket, this.consumerManager, this.mediaElementManager);

            // Rejoin the room
            await this.joinRoom();

            console.log('Reconnection successful');
        } catch (error) {
            console.error('Reconnection failed:', error);
            throw error;
        }
    }
}

export default RoomClient;
